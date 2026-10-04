/* Local recovery envelopes only. A draft never edits the canonical record or its approval. */
(function (root, factory) {
  'use strict';
  var commonJS = typeof module === 'object' && module.exports;
  var api = factory(commonJS ? require('./core.js') : root.InspectionCore);
  if (commonJS) module.exports = api;
  else root.InspectionDrafts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (defaultCore) {
  'use strict';

  var EDITABLE = ['owner', 'dueDate', 'rootCause', 'impact', 'interimAction', 'correctiveAction', 'effectivenessPlan', 'effectivenessResult', 'responseDraft', 'status', 'evidenceIds', 'sourceIds'];
  var ENVELOPE_KEYS = ['version', 'caseId', 'findingId', 'baseFingerprint', 'patch', 'tab', 'language', 'updatedAt'];
  var META_KEYS = ['tab', 'language', 'updatedAt'];
  var TABS = ['plan', 'evidence', 'response'];
  var LANGUAGES = ['en', 'zh-CN'];
  var SNAPSHOT_PREFIX = 'snapshot-v1:';

  function plain(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    var prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
  function keysAllowed(value, allowed, required) {
    return plain(value) && Object.keys(value).every(function (key) { return allowed.indexOf(key) >= 0; }) && (!required || required.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); }));
  }
  function text(value) { return typeof value === 'string' && value.length <= 20000; }
  function idValid(value) { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value); }
  function dateValid(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function timestampValid(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && dateValid(value.slice(0, 10)) && Number(value.slice(11, 13)) <= 23 && Number(value.slice(14, 16)) <= 59 && Number(value.slice(17, 19)) <= 59 && Number.isFinite(Date.parse(value));
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function getContext(dataset, findingId, Core) {
    var api = Core || defaultCore;
    if (!api || typeof api.validateDataset !== 'function') throw new Error('InspectionCore.validateDataset is required.');
    var validation = api.validateDataset(dataset);
    if (!validation.valid) throw new Error('Draft recovery requires a valid canonical dataset.');
    return dataset.findings.find(function (finding) { return finding.id === findingId; });
  }
  // A consistently ordered snapshot detects ordinary edits, imports and reference changes.
  // Its bounded, non-cryptographic checksum is not a signature, identity check or security
  // mechanism. Other findings and the display reference date are excluded; case, review,
  // history and reference content are included. The snapshot itself is not stored twice.
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value !== null && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) { return JSON.stringify(key) + ':' + stable(value[key]); }).join(',') + '}';
    }
    return JSON.stringify(value);
  }
  function byId(items) {
    return items.slice().sort(function (left, right) { return left.id < right.id ? -1 : left.id > right.id ? 1 : 0; });
  }
  function fingerprint(dataset, finding) {
    var snapshot = stable({ case: dataset.case, finding: finding, evidence: byId(dataset.evidence), sources: byId(dataset.sources) });
    var first = 2166136261, second = 5381;
    for (var index = 0; index < snapshot.length; index += 1) {
      var code = snapshot.charCodeAt(index);
      first = Math.imul(first ^ code, 16777619) >>> 0;
      second = (Math.imul(second, 33) ^ code) >>> 0;
    }
    return SNAPSHOT_PREFIX + snapshot.length + ':' + first.toString(16).padStart(8, '0') + ':' + second.toString(16).padStart(8, '0');
  }
  function referencesValid(value, records) {
    if (!Array.isArray(value) || value.length > 1000) return false;
    var seen = new Set();
    return value.every(function (id) {
      if (!idValid(id) || seen.has(id) || !records.some(function (item) { return item.id === id; })) return false;
      seen.add(id);
      return true;
    });
  }
  function patchValid(patch, dataset, finding) {
    if (!keysAllowed(patch, EDITABLE) || !Object.keys(patch).length) return false;
    return Object.keys(patch).every(function (key) {
      if (key === 'evidenceIds') return referencesValid(patch[key], dataset.evidence);
      if (key === 'sourceIds') return referencesValid(patch[key], dataset.sources);
      if (!text(patch[key])) return false;
      if (key === 'dueDate') return patch[key] === '' || dateValid(patch[key]);
      // Recovery cannot bypass the explicit closeFinding transition. Editing a closed
      // record may keep its current status in the draft; canonical save will reopen it.
      if (key === 'status') return ['open', 'in_progress', 'closed'].indexOf(patch[key]) >= 0 && (patch[key] !== 'closed' || finding.status === 'closed');
      return true;
    });
  }
  function createDraft(dataset, findingId, patch, meta, Core) {
    var finding = getContext(dataset, findingId, Core);
    if (!idValid(findingId) || !finding) throw new Error('A draft needs an existing finding ID.');
    if (!patchValid(patch, dataset, finding)) throw new Error('Invalid recovery draft patch.');
    var metadata = meta === undefined ? {} : meta;
    if (!keysAllowed(metadata, META_KEYS)) throw new Error('Invalid draft metadata.');
    var tab = metadata.tab === undefined ? 'plan' : metadata.tab;
    var language = metadata.language === undefined ? 'zh-CN' : metadata.language;
    if (TABS.indexOf(tab) < 0 || LANGUAGES.indexOf(language) < 0 || !timestampValid(metadata.updatedAt)) throw new Error('Draft metadata needs a supported tab, language and explicit ISO updatedAt timestamp.');
    return {
      version: 1, caseId: dataset.case.id, findingId: findingId,
      baseFingerprint: fingerprint(dataset, finding), patch: clone(patch),
      tab: tab, language: language, updatedAt: metadata.updatedAt
    };
  }
  function validateDraft(envelope, dataset, Core) {
    if (envelope === null || envelope === undefined) return { valid: false, reason: 'missing' };
    try {
      if (!keysAllowed(envelope, ENVELOPE_KEYS, ENVELOPE_KEYS) || envelope.version !== 1 || !text(envelope.caseId) || !envelope.caseId.trim() || !idValid(envelope.findingId) || typeof envelope.baseFingerprint !== 'string' || !/^snapshot-v1:\d{1,10}:[0-9a-f]{8}:[0-9a-f]{8}$/.test(envelope.baseFingerprint) || TABS.indexOf(envelope.tab) < 0 || LANGUAGES.indexOf(envelope.language) < 0 || !timestampValid(envelope.updatedAt)) return { valid: false, reason: 'invalid' };
      var finding = getContext(dataset, envelope.findingId, Core);
      if (envelope.caseId !== dataset.case.id) return { valid: false, reason: 'stale' };
      if (!finding) return { valid: false, reason: 'missing' };
      if (envelope.baseFingerprint !== fingerprint(dataset, finding)) return { valid: false, reason: 'stale' };
      if (!patchValid(envelope.patch, dataset, finding)) return { valid: false, reason: 'invalid' };
      return { valid: true, reason: 'valid', draft: clone(envelope) };
    } catch (_) {
      return { valid: false, reason: 'invalid' };
    }
  }

  return { createDraft: createDraft, validateDraft: validateDraft };
});
