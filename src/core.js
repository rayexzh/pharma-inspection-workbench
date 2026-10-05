/* Pure, deterministic workflow helpers. These are portfolio rules, not a GMP compliance engine. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InspectionCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FINDING_TEXT = ['id', 'title', 'severity', 'area', 'description', 'status', 'owner', 'dueDate', 'rootCause', 'impact', 'interimAction', 'correctiveAction', 'effectivenessPlan', 'effectivenessResult', 'responseDraft'];
  var EDITABLE = FINDING_TEXT.filter(function (key) { return key !== 'id'; }).concat(['evidenceIds', 'sourceIds']);
  var REQUIRED = [
    ['owner', 'Owner'], ['dueDate', 'Due date'], ['rootCause', 'Root cause'],
    ['impact', 'Impact / wider scope assessment'], ['interimAction', 'Interim action or reason it is not needed'],
    ['correctiveAction', 'Corrective action'], ['effectivenessPlan', 'Effectiveness plan'], ['responseDraft', 'Response draft']
  ];

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
  function dateValid(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function timestampValid(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && dateValid(value.slice(0, 10)) && Number(value.slice(11, 13)) <= 23 && Number(value.slice(14, 16)) <= 59 && Number(value.slice(17, 19)) <= 59 && Number.isFinite(Date.parse(value));
  }
  function httpsValid(value) {
    try {
      var url = new URL(value);
      return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
    } catch (_) { return false; }
  }
  function validateDataset(value) {
    var errors = [];
    function error(path, message) { errors.push(path + ': ' + message); }
    function shape(item, path, keys, optional) {
      if (!record(item)) { error(path, 'must be an object'); return false; }
      Object.keys(item).forEach(function (key) {
        if (keys.indexOf(key) < 0 && (!optional || optional.indexOf(key) < 0)) error(path + '.' + key, 'unexpected property');
      });
      keys.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(item, key)) error(path + '.' + key, 'is required');
      });
      return true;
    }
    function string(item, key, path, required) {
      if (typeof item[key] !== 'string') error(path + '.' + key, 'must be a string');
      else if (item[key].length > 20000) error(path + '.' + key, 'exceeds 20,000 characters');
      else if (required && !item[key].trim()) error(path + '.' + key, 'must not be blank');
    }
    function enumValue(item, key, path, values) {
      if (values.indexOf(item[key]) < 0) error(path + '.' + key, 'must be ' + values.join(' / '));
    }
    function array(item, key, path, limit) {
      if (!Array.isArray(item[key])) { error(path + '.' + key, 'must be an array'); return false; }
      if (item[key].length > limit) { error(path + '.' + key, 'exceeds ' + limit + ' entries'); return false; }
      return true;
    }
    function ids(items, path) {
      var seen = new Set();
      items.forEach(function (item, index) {
        if (!record(item)) return;
        if (typeof item.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(item.id)) error(path + '[' + index + '].id', 'must be a simple ID of 1-100 letters, digits, underscores or hyphens');
        if (seen.has(item.id)) error(path + '[' + index + '].id', 'duplicate ID ' + item.id);
        seen.add(item.id);
      });
      return seen;
    }
    function refs(finding, key, path, existing) {
      if (!array(finding, key, path, 1000)) return;
      var seen = new Set();
      finding[key].forEach(function (id, index) {
        if (typeof id !== 'string' || !existing.has(id)) error(path + '.' + key + '[' + index + ']', 'unknown reference ' + String(id));
        if (seen.has(id)) error(path + '.' + key + '[' + index + ']', 'duplicate reference ' + String(id));
        seen.add(id);
      });
    }
    if (!shape(value, 'dataset', ['schemaVersion', 'referenceDate', 'case', 'sources', 'evidence', 'findings'])) return { valid: false, errors: errors };
    if (value.schemaVersion !== 1) error('schemaVersion', 'only schema version 1 is supported');
    if (!dateValid(value.referenceDate)) error('referenceDate', 'must be a real date in YYYY-MM-DD format');
    if (shape(value.case, 'case', ['id', 'name', 'site', 'inspectionDate', 'description'])) {
      ['id', 'name', 'site', 'inspectionDate', 'description'].forEach(function (key) { string(value.case, key, 'case', true); });
      if (!dateValid(value.case.inspectionDate)) error('case.inspectionDate', 'must be a real date in YYYY-MM-DD format');
    }
    var sourceItems = array(value, 'sources', 'dataset', 1000) ? value.sources : [];
    var evidenceItems = array(value, 'evidence', 'dataset', 1000) ? value.evidence : [];
    var findingItems = array(value, 'findings', 'dataset', 500) ? value.findings : [];
    if (Array.isArray(value.findings) && value.findings.length === 0) error('dataset.findings', 'must contain at least one finding');
    var sourceIds = ids(sourceItems, 'sources');
    var evidenceIds = ids(evidenceItems, 'evidence');
    ids(findingItems, 'findings');
    sourceItems.forEach(function (item, index) {
      var path = 'sources[' + index + ']';
      if (!shape(item, path, ['id', 'title', 'url', 'checkedOn', 'scope'])) return;
      ['id', 'title', 'url', 'checkedOn', 'scope'].forEach(function (key) { string(item, key, path, true); });
      if (!httpsValid(item.url)) error(path + '.url', 'must be an HTTP(S) URL without embedded credentials');
      if (!dateValid(item.checkedOn)) error(path + '.checkedOn', 'must be a real date in YYYY-MM-DD format');
    });
    evidenceItems.forEach(function (item, index) {
      var path = 'evidence[' + index + ']';
      if (!shape(item, path, ['id', 'title', 'version', 'status', 'locator', 'summary', 'content'])) return;
      ['id', 'title', 'version', 'status', 'locator', 'summary', 'content'].forEach(function (key) { string(item, key, path, ['id', 'title', 'version', 'status', 'summary'].indexOf(key) >= 0); });
      enumValue(item, 'status', path, ['current', 'missing', 'superseded']);
      if (item.status === 'missing') {
        if (item.locator !== '' || item.content !== '') error(path, 'missing evidence must have an empty locator and content');
      } else {
        if (typeof item.locator !== 'string' || !/^evidence\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/.test(item.locator)) error(path + '.locator', 'must be a local evidence/name.md path');
        if (!nonempty(item.content)) error(path + '.content', 'available evidence must contain a readable record');
      }
    });
    findingItems.forEach(function (item, index) {
      var path = 'findings[' + index + ']';
      if (!shape(item, path, FINDING_TEXT.concat(['evidenceIds', 'sourceIds', 'review', 'history']))) return;
      FINDING_TEXT.forEach(function (key) { string(item, key, path, ['id', 'title', 'severity', 'area', 'description', 'status'].indexOf(key) >= 0); });
      enumValue(item, 'severity', path, ['major', 'other']);
      enumValue(item, 'status', path, ['open', 'in_progress', 'closed']);
      if (item.dueDate !== '' && !dateValid(item.dueDate)) error(path + '.dueDate', 'must be blank or a real date in YYYY-MM-DD format');
      refs(item, 'evidenceIds', path, evidenceIds);
      refs(item, 'sourceIds', path, sourceIds);
      if (shape(item.review, path + '.review', ['status', 'reviewer', 'reviewedAt'])) {
        ['status', 'reviewer', 'reviewedAt'].forEach(function (key) { string(item.review, key, path + '.review', false); });
        enumValue(item.review, 'status', path + '.review', ['pending', 'approved']);
        if (item.review.status === 'approved') {
          if (!nonempty(item.review.reviewer)) error(path + '.review.reviewer', 'approved review needs a named reviewer');
          if (!timestampValid(item.review.reviewedAt)) error(path + '.review.reviewedAt', 'approved review needs an explicit ISO timestamp');
        } else if (item.review.reviewer !== '' || item.review.reviewedAt !== '') error(path + '.review', 'pending review must have empty reviewer and reviewedAt');
      }
      if (array(item, 'history', path, 10000)) item.history.forEach(function (entry, historyIndex) {
        var historyPath = path + '.history[' + historyIndex + ']';
        if (!shape(entry, historyPath, ['timestamp', 'actor', 'action'], ['changes'])) return;
        ['timestamp', 'actor', 'action'].forEach(function (key) { string(entry, key, historyPath, true); });
        if (!timestampValid(entry.timestamp)) error(historyPath + '.timestamp', 'must be an explicit ISO timestamp');
        if (Object.prototype.hasOwnProperty.call(entry, 'changes')) {
          if (!array(entry, 'changes', historyPath, EDITABLE.length)) return;
          if (!entry.changes.length) error(historyPath + '.changes', 'must contain at least one changed field');
          var fields = new Set();
          entry.changes.forEach(function (change, changeIndex) {
            var changePath = historyPath + '.changes[' + changeIndex + ']';
            if (!shape(change, changePath, ['field', 'before', 'after'])) return;
            if (EDITABLE.indexOf(change.field) < 0) { error(changePath + '.field', 'must be an editable finding field'); return; }
            if (fields.has(change.field)) error(changePath + '.field', 'duplicate changed field');
            fields.add(change.field);
            ['before', 'after'].forEach(function (side) {
              var snapshot = change[side];
              if (change.field === 'evidenceIds' || change.field === 'sourceIds') {
                // Historical links need not still exist in the current register.
                if (!Array.isArray(snapshot) || snapshot.length > 1000 || snapshot.some(function (id) { return typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(id); }) || new Set(snapshot).size !== snapshot.length) error(changePath + '.' + side, 'must contain unique simple reference IDs');
              } else if (typeof snapshot !== 'string' || snapshot.length > 20000) error(changePath + '.' + side, 'must be text up to 20,000 characters');
              else if (change.field === 'dueDate' && snapshot !== '' && !dateValid(snapshot)) error(changePath + '.' + side, 'must be blank or a real date');
              else if (change.field === 'status' && ['open', 'in_progress', 'closed'].indexOf(snapshot) < 0) error(changePath + '.' + side, 'invalid finding status');
              else if (change.field === 'severity' && ['major', 'other'].indexOf(snapshot) < 0) error(changePath + '.' + side, 'invalid classification');
            });
            if (JSON.stringify(change.before) === JSON.stringify(change.after)) error(changePath, 'before and after must differ');
          });
        }
      });
    });
    // Imports must not claim an internally approved or closed state that contradicts the
    // same field/reference checks enforced by transitions. This remains a completeness rule.
    if (!errors.length) findingItems.forEach(function (item, index) {
      var check = evaluation(item, value, value.referenceDate);
      if (item.review.status === 'approved' && !check.canApprove) error('findings[' + index + '].review', 'approved record fails required completeness / evidence / source checks');
      if (item.status === 'closed' && !check.canClose) error('findings[' + index + '].status', 'closed record needs complete fields, current evidence, an effectiveness result and approved review');
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function ensureDataset(dataset) {
    var validation = validateDataset(dataset);
    if (!validation.valid) throw new Error('Invalid dataset: ' + validation.errors.slice(0, 8).join('; '));
  }
  function evaluation(finding, dataset, referenceDate) {
    var issues = [], blockers = 0, evidenceGaps = 0, sourceGaps = 0;
    function issue(code, label, detail, blocksApproval) {
      issues.push({ code: code, label: label, detail: detail });
      if (blocksApproval) blockers += 1;
    }
    REQUIRED.forEach(function (requirement) {
      if (!nonempty(finding[requirement[0]])) issue('missing_' + requirement[0], requirement[1] + ' is missing', 'Add a case-specific ' + requirement[1].toLowerCase() + '.', true);
    });
    if (finding.dueDate && !dateValid(finding.dueDate)) issue('invalid_due_date', 'Due date is invalid', 'Use a real calendar date in YYYY-MM-DD format.', true);
    if (!finding.evidenceIds.length) {
      evidenceGaps += 1;
      issue('no_evidence', 'No evidence linked', 'Link at least one current internal evidence record. A link alone does not establish adequacy.', true);
    }
    finding.evidenceIds.forEach(function (id) {
      var entry = dataset.evidence.find(function (item) { return item.id === id; });
      if (!entry || entry.status !== 'current') {
        evidenceGaps += 1;
        var state = entry ? entry.status : 'unknown';
        issue('evidence_' + state, 'Evidence ' + id + ' is ' + state, entry ? entry.title + ': ' + entry.summary : 'Resolve the dangling evidence reference.', true);
      }
    });
    if (!finding.sourceIds.length) {
      sourceGaps += 1;
      issue('no_source', 'No source mapped', 'A person must select and assess a relevant source. This app does not determine legal applicability.', true);
    }
    finding.sourceIds.forEach(function (id) {
      if (!dataset.sources.some(function (item) { return item.id === id; })) {
        sourceGaps += 1;
        issue('source_unknown', 'Source ' + id + ' is unavailable', 'Resolve the source reference and verify its applicability manually.', true);
      }
    });
    var canApprove = blockers === 0;
    var reviewApproved = finding.review.status === 'approved' && nonempty(finding.review.reviewer) && timestampValid(finding.review.reviewedAt);
    if (!reviewApproved) issue('missing_review', 'Technical review is pending', 'A named person must review the record; the app cannot assess their competence or authority.', false);
    if (!nonempty(finding.effectivenessResult)) issue('missing_effectivenessResult', 'Effectiveness result is missing', 'Record the completed check and outcome before closure. A planned check is not a result.', false);
    var overdue = finding.status !== 'closed' && dateValid(finding.dueDate) && finding.dueDate < referenceDate;
    if (overdue) issue('overdue', 'Commitment date has passed', 'Assess the delay and required communication. An overdue flag does not assess regulatory acceptability.', false);
    return { issues: issues, canApprove: canApprove, canClose: canApprove && reviewApproved && nonempty(finding.effectivenessResult), overdue: overdue, evidenceGaps: evidenceGaps, sourceGaps: sourceGaps };
  }
  function evaluateFinding(finding, dataset, referenceDate) {
    ensureDataset(dataset);
    var day = referenceDate || dataset.referenceDate;
    if (!dateValid(day)) throw new Error('Reference date must be a real YYYY-MM-DD date.');
    if (!record(finding)) throw new Error('A finding object is required.');
    var stored = dataset.findings.find(function (item) { return item.id === finding.id; });
    if (!stored) throw new Error('Finding ' + String(finding.id) + ' is not in this dataset.');
    // Validate a proposed draft against the same schema; incomplete content remains a workflow issue.
    var draftDataset = clone(dataset);
    draftDataset.findings[draftDataset.findings.findIndex(function (item) { return item.id === finding.id; })] = clone(finding);
    ensureDataset(draftDataset);
    return evaluation(finding, dataset, day);
  }
  function summarise(dataset, referenceDate) {
    ensureDataset(dataset);
    var day = referenceDate || dataset.referenceDate;
    if (!dateValid(day)) throw new Error('Reference date must be a real YYYY-MM-DD date.');
    var result = { total: dataset.findings.length, open: 0, closed: 0, overdue: 0, needsReview: 0, evidenceGaps: 0 };
    dataset.findings.forEach(function (finding) {
      var check = evaluation(finding, dataset, day);
      if (finding.status === 'closed') result.closed += 1;
      else {
        result.open += 1;
        if (finding.review.status !== 'approved') result.needsReview += 1;
      }
      if (check.overdue) result.overdue += 1;
      result.evidenceGaps += check.evidenceGaps;
    });
    return result;
  }
  function transition(dataset, id, actor, timestamp) {
    ensureDataset(dataset);
    if (!nonempty(actor)) throw new Error('A non-empty actor / reviewer name is required.');
    if (!timestampValid(timestamp)) throw new Error('An explicit ISO timestamp with a timezone is required.');
    var next = clone(dataset);
    var finding = next.findings.find(function (item) { return item.id === id; });
    if (!finding) throw new Error('Unknown finding: ' + String(id));
    var newest = finding.history.reduce(function (latest, entry) { return Math.max(latest, Date.parse(entry.timestamp)); }, -Infinity);
    if (finding.review.status === 'approved') newest = Math.max(newest, Date.parse(finding.review.reviewedAt));
    if (Date.parse(timestamp) < newest) throw new Error('Timestamp must not be earlier than the existing history or review.');
    return { dataset: next, finding: finding, actor: actor.trim(), timestamp: timestamp };
  }
  function append(context, action, changes) {
    var entry = { timestamp: context.timestamp, actor: context.actor, action: action };
    if (changes && changes.length) entry.changes = clone(changes);
    context.finding.history.push(entry);
    ensureDataset(context.dataset);
    return context.dataset;
  }
  function saveFinding(dataset, id, patch, actor, timestamp) {
    if (!record(patch)) throw new Error('A patch object is required.');
    Object.keys(patch).forEach(function (key) {
      if (EDITABLE.indexOf(key) < 0) throw new Error('Field cannot be edited through saveFinding: ' + key);
    });
    var context = transition(dataset, id, actor, timestamp);
    var finding = context.finding;
    if (patch.status === 'closed' && finding.status !== 'closed') throw new Error('Use closeFinding to close a finding after all checks pass.');
    var changed = Object.keys(patch).filter(function (key) { return JSON.stringify(finding[key]) !== JSON.stringify(patch[key]); });
    if (!changed.length) return context.dataset;
    var before = clone(finding);
    changed.forEach(function (key) { finding[key] = clone(patch[key]); });
    var wasApproved = finding.review.status === 'approved';
    finding.review = { status: 'pending', reviewer: '', reviewedAt: '' };
    // Every editable field affects the scope, commitment, evidence or response being reviewed.
    if (finding.status === 'closed') finding.status = 'in_progress';
    ensureDataset(context.dataset);
    return append(context, 'Edited ' + changed.join(', ') + (wasApproved ? '; previous technical approval reset' : '') + '.', compareFields(before, finding));
  }
  function compareFields(before, after) {
    return EDITABLE.filter(function (key) { return JSON.stringify(before[key]) !== JSON.stringify(after[key]); }).map(function (key) {
      return { field: key, before: clone(before[key]), after: clone(after[key]) };
    });
  }
  function previewChanges(dataset, id, patch) {
    ensureDataset(dataset);
    if (!record(patch)) throw new Error('A patch object is required.');
    Object.keys(patch).forEach(function (key) { if (EDITABLE.indexOf(key) < 0) throw new Error('Field cannot be edited through saveFinding: ' + key); });
    var next = clone(dataset);
    var finding = next.findings.find(function (item) { return item.id === id; });
    if (!finding) throw new Error('Unknown finding: ' + String(id));
    var before = clone(finding);
    if (patch.status === 'closed' && finding.status !== 'closed') throw new Error('Use closeFinding to close a finding after all checks pass.');
    Object.keys(patch).forEach(function (key) { finding[key] = clone(patch[key]); });
    var changes = compareFields(before, finding);
    if (!changes.length) return { changes: [], reviewReset: false, reopensClosed: false };
    finding.review = { status: 'pending', reviewer: '', reviewedAt: '' };
    if (finding.status === 'closed') finding.status = 'in_progress';
    ensureDataset(next);
    return { changes: compareFields(before, finding), reviewReset: before.review.status === 'approved', reopensClosed: before.status === 'closed' && finding.status !== 'closed' };
  }
  function approveFinding(dataset, id, reviewer, timestamp) {
    var context = transition(dataset, id, reviewer, timestamp);
    var check = evaluation(context.finding, context.dataset, timestamp.slice(0, 10));
    if (!check.canApprove) throw new Error('Cannot approve: complete the required fields, current evidence and source mapping first.');
    context.finding.review = { status: 'approved', reviewer: context.actor, reviewedAt: timestamp };
    return append(context, 'Recorded named technical review approval (portfolio workflow; no identity or qualification verification).');
  }
  function closeFinding(dataset, id, actor, timestamp) {
    var context = transition(dataset, id, actor, timestamp);
    if (context.finding.status === 'closed') throw new Error('Finding is already closed.');
    var check = evaluation(context.finding, context.dataset, timestamp.slice(0, 10));
    if (!check.canClose) throw new Error('Cannot close: current evidence, complete response fields, an effectiveness result and approved technical review are required.');
    context.finding.status = 'closed';
    return append(context, 'Closed after internal workflow checks; closure does not establish regulatory acceptance.');
  }
  function csvCell(value) {
    var text = String(value === null || value === undefined ? '' : value);
    // Quoting alone does not prevent spreadsheet formula evaluation. Neutralise dangerous starts,
    // including starts hidden behind spaces, tabs, line breaks or byte-order marks.
    if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function addFinding(dataset, fields, actor, timestamp) {
    ensureDataset(dataset);
    if (!record(fields)) throw new Error('New finding fields are required.');
    if (!nonempty(actor)) throw new Error('A non-empty actor / reviewer name is required.');
    if (!timestampValid(timestamp)) throw new Error('An explicit ISO timestamp with a timezone is required.');
    var allowed = ['title', 'area', 'description', 'severity', 'owner', 'dueDate'];
    Object.keys(fields).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error('Unexpected new finding field: ' + key);
    });
    var next = clone(dataset);
    var number = 1;
    var id;
    do { id = 'F-' + String(number++).padStart(3, '0'); } while (next.findings.some(function (item) { return item.id === id; }));
    var finding = {
      id: id,
      title: fields.title,
      area: fields.area,
      description: fields.description,
      severity: fields.severity === undefined ? 'other' : fields.severity,
      status: 'open',
      owner: fields.owner === undefined ? '' : fields.owner,
      dueDate: fields.dueDate === undefined ? '' : fields.dueDate,
      rootCause: '', impact: '', interimAction: '', correctiveAction: '',
      effectivenessPlan: '', effectivenessResult: '', responseDraft: '',
      evidenceIds: [], sourceIds: [],
      review: {status: 'pending', reviewer: '', reviewedAt: ''},
      history: [{
        timestamp: timestamp,
        actor: actor.trim(),
        action: 'Created a fictional training finding; investigation and supporting records remain pending.'
      }]
    };
    next.findings.push(finding);
    ensureDataset(next);
    return next;
  }
  function csvExport(dataset, referenceDate) {
    ensureDataset(dataset);
    var day = referenceDate || dataset.referenceDate;
    if (!dateValid(day)) throw new Error('Reference date must be a real YYYY-MM-DD date.');
    var rows = [['Finding ID', 'Title', 'Severity', 'Area', 'Status', 'Owner', 'Due date', 'Overdue as of ' + day, 'Technical review', 'Reviewer', 'Evidence gaps', 'Source gaps', 'Root cause', 'Impact assessment', 'Interim action', 'Corrective action', 'Effectiveness plan', 'Effectiveness result', 'Response draft', 'Evidence IDs', 'Source IDs']];
    dataset.findings.forEach(function (finding) {
      var check = evaluation(finding, dataset, day);
      rows.push([finding.id, finding.title, finding.severity, finding.area, finding.status, finding.owner, finding.dueDate, check.overdue ? 'Yes' : 'No', finding.review.status, finding.review.reviewer, check.evidenceGaps, check.sourceGaps, finding.rootCause, finding.impact, finding.interimAction, finding.correctiveAction, finding.effectivenessPlan, finding.effectivenessResult, finding.responseDraft, finding.evidenceIds.join('; '), finding.sourceIds.join('; ')]);
    });
    return rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  function md(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([\\`*_{}\[\]#|])/g, '\\$1');
  }
  function markdownReport(dataset, referenceDate) {
    ensureDataset(dataset);
    var day = referenceDate || dataset.referenceDate;
    var summary = summarise(dataset, day);
    var lines = ['# Internal inspection review report', '', '**Portfolio workflow output — not a regulator submission or a determination of compliance.**', '', 'Case: ' + md(dataset.case.name), 'Site: ' + md(dataset.case.site), 'Inspection date: ' + dataset.case.inspectionDate, 'Reference date: ' + day, '', 'This export keeps evidence references for internal review. Attach evidence to a regulatory response only when requested and appropriate. Named review entries are editable local records, not verified signatures.', '', '## Overview', '', '- Total findings: ' + summary.total, '- Open / in progress: ' + summary.open, '- Closed: ' + summary.closed, '- Overdue: ' + summary.overdue, '- Awaiting technical review: ' + summary.needsReview, '- Evidence gaps: ' + summary.evidenceGaps, ''];
    dataset.findings.forEach(function (finding) {
      var check = evaluation(finding, dataset, day);
      lines.push('## ' + md(finding.id) + ' — ' + md(finding.title), '', '- Classification: ' + md(finding.severity), '- Area: ' + md(finding.area), '- Status: ' + md(finding.status), '- Owner: ' + md(finding.owner || 'Unassigned'), '- Due date: ' + (finding.dueDate || 'Not set'), '- Overdue: ' + (check.overdue ? 'Yes' : 'No'), '- Technical review: ' + md(finding.review.status) + (finding.review.reviewer ? ' by ' + md(finding.review.reviewer) + ' at ' + finding.review.reviewedAt : ''), '');
      [['description', 'Inspection finding'], ['rootCause', 'Root cause'], ['impact', 'Impact and wider scope'], ['interimAction', 'Interim action'], ['correctiveAction', 'Corrective action'], ['effectivenessPlan', 'Effectiveness plan'], ['effectivenessResult', 'Effectiveness result'], ['responseDraft', 'Response draft']].forEach(function (field) { lines.push('### ' + field[1], '', md(finding[field[0]] || 'Not recorded.'), ''); });
      lines.push('### Internal evidence index', '');
      if (!finding.evidenceIds.length) lines.push('- No evidence linked.');
      finding.evidenceIds.forEach(function (id) {
        var evidence = dataset.evidence.find(function (item) { return item.id === id; });
        lines.push('- ' + md(id) + ': ' + md(evidence.title) + ' — ' + md(evidence.status) + ', version ' + md(evidence.version) + (evidence.locator ? '; local locator: ' + md(evidence.locator) : '; no file available') + '.');
      });
      lines.push('', '### Manually mapped sources', '');
      if (!finding.sourceIds.length) lines.push('- No source mapped.');
      finding.sourceIds.forEach(function (id) {
        var source = dataset.sources.find(function (item) { return item.id === id; });
        lines.push('- [' + md(source.title) + '](' + source.url.replace(/[()\s]/g, encodeURIComponent) + ') — checked ' + source.checkedOn + '. Scope: ' + md(source.scope));
      });
      lines.push('', '### Workflow observations', '');
      if (!check.issues.length) lines.push('- No outstanding prototype checks. A qualified person still needs to assess adequacy and applicability.');
      check.issues.forEach(function (issue) { lines.push('- ' + md(issue.label) + ': ' + md(issue.detail)); });
      lines.push('', '### Local activity history', '');
      finding.history.forEach(function (entry) {
        lines.push('- ' + entry.timestamp + ' — ' + md(entry.actor) + ': ' + md(entry.action));
        if (entry.changes) entry.changes.forEach(function (change) {
          function snapshot(value) { return md(Array.isArray(value) ? value.join('; ') || 'No references' : value || 'Not recorded'); }
          lines.push('  - ' + md(change.field), '    - Before: ' + snapshot(change.before).replace(/\n/g, '\n      '), '    - After: ' + snapshot(change.after).replace(/\n/g, '\n      '));
        });
      });
      if (!finding.history.length) lines.push('- No history recorded.');
      lines.push('');
    });
    return lines.join('\n') + '\n';
  }

  return { clone: clone, validateDataset: validateDataset, evaluateFinding: evaluateFinding, summarise: summarise, saveFinding: saveFinding, previewChanges: previewChanges, addFinding: addFinding, approveFinding: approveFinding, closeFinding: closeFinding, csvExport: csvExport, markdownReport: markdownReport };
});
