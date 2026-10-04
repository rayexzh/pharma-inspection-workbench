'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../src/core.js');
const demo = require('../data/demo-data.js');

function seed() { return demo.createDataset(); }
function get(data, id) { return data.findings.find(item => item.id === id); }
function ready(data, id = 'F-002') {
  return core.saveFinding(data, id, { effectivenessResult: 'Completed synthetic test: all 30 alarm acknowledgements met the predefined five-minute target; no exceptions in the simulated period.' }, 'Demo editor', '2026-10-14T10:00:00.000Z');
}

test('demo validates, exhibits distinct gaps and includes a complete closed finding', () => {
  const data = seed();
  assert.deepEqual(core.validateDataset(data), { valid: true, errors: [] });
  assert.deepEqual(core.summarise(data, '2026-10-04'), { total: 6, open: 5, closed: 1, overdue: 1, needsReview: 4, evidenceGaps: 3 });
  const first = core.evaluateFinding(get(data, 'F-001'), data, '2026-10-04');
  assert.equal(first.overdue, true);
  assert.equal(first.evidenceGaps, 2);
  assert.equal(first.canApprove, false);
  assert(first.issues.some(issue => issue.code === 'evidence_superseded'));
  assert(first.issues.some(issue => issue.code === 'evidence_missing'));
  const closed = core.evaluateFinding(get(data, 'F-003'), data, '2026-10-04');
  assert.equal(closed.canClose, true);
  assert.equal(closed.overdue, false);
  assert.deepEqual(closed.issues, []);
});

test('reference date uses a strict day boundary and never mutates approvals', () => {
  const data = seed();
  const before = JSON.stringify(data);
  assert.equal(core.evaluateFinding(get(data, 'F-006'), data, '2026-10-03').overdue, false);
  assert.equal(core.evaluateFinding(get(data, 'F-006'), data, '2026-10-04').overdue, false);
  assert.equal(core.evaluateFinding(get(data, 'F-006'), data, '2026-10-05').overdue, true);
  assert.equal(core.summarise(data, '2026-10-05').overdue, 2);
  assert.equal(JSON.stringify(data), before);
  assert.throws(() => core.summarise(data, '2026-02-30'), /Reference date/);
});

test('closure is blocked until completeness, a result and named review exist', () => {
  const data = seed();
  assert.throws(() => core.closeFinding(data, 'F-001', 'Demo reviewer', '2026-10-04T12:00:00Z'), /Cannot close/);
  assert.throws(() => core.approveFinding(data, 'F-001', 'Demo reviewer', '2026-10-04T12:00:00Z'), /Cannot approve/);
  assert.throws(() => core.closeFinding(data, 'F-006', 'Demo reviewer', '2026-10-04T12:00:00Z'), /Cannot close/);
  assert.throws(() => core.saveFinding(data, 'F-002', { status: 'closed' }, 'Demo editor', '2026-10-04T12:00:00Z'), /Use closeFinding/);
  const approved = core.approveFinding(data, 'F-002', 'Demo technical reviewer', '2026-10-04T12:00:00Z');
  assert.equal(get(approved, 'F-002').review.status, 'approved');
  assert.equal(core.evaluateFinding(get(approved, 'F-002'), approved).canClose, false);
  assert.throws(() => core.closeFinding(approved, 'F-002', 'Demo reviewer', '2026-10-04T12:01:00Z'), /Cannot close/);
  const withResult = ready(approved);
  assert.equal(get(withResult, 'F-002').review.status, 'pending');
  assert.throws(() => core.closeFinding(withResult, 'F-002', 'Demo reviewer', '2026-10-14T10:01:00Z'), /Cannot close/);
  assert.throws(() => core.approveFinding(withResult, 'Demo nonexistent ID', 'Demo reviewer', '2026-10-14T11:00:00Z'), /Unknown finding/);
});

test('a complete finding can be approved and closed with immutable prior history', () => {
  const data = seed();
  const originalHistory = core.clone(get(data, 'F-002').history);
  const withResult = ready(data);
  const reviewed = core.approveFinding(withResult, 'F-002', '  Demo reviewer  ', '2026-10-14T11:00:00.000Z');
  const closed = core.closeFinding(reviewed, 'F-002', 'Demo coordinator', '2026-10-14T12:00:00.000Z');
  assert.equal(get(closed, 'F-002').status, 'closed');
  assert.equal(get(closed, 'F-002').review.reviewer, 'Demo reviewer');
  assert.equal(core.evaluateFinding(get(closed, 'F-002'), closed, '2026-11-01').canClose, true);
  assert.deepEqual(get(closed, 'F-002').history.slice(0, originalHistory.length), originalHistory);
  assert.equal(get(closed, 'F-002').history.length, originalHistory.length + 3);
  assert.deepEqual(get(data, 'F-002').history, originalHistory);
  assert.equal(get(data, 'F-002').review.status, 'pending');
  assert.throws(() => core.closeFinding(closed, 'F-002', 'Demo coordinator', '2026-10-14T12:01:00Z'), /already closed/);
});

test('material edits reset approval and reopen a closed finding', () => {
  const data = seed();
  const original = core.clone(get(data, 'F-003'));
  const changed = core.saveFinding(data, 'F-003', { correctiveAction: original.correctiveAction + ' Additional folder migration check.' }, 'Demo editor', '2026-10-04T10:00:00Z');
  const finding = get(changed, 'F-003');
  assert.equal(finding.status, 'in_progress');
  assert.deepEqual(finding.review, { status: 'pending', reviewer: '', reviewedAt: '' });
  assert.equal(core.evaluateFinding(finding, changed).canClose, false);
  assert.deepEqual(finding.history.slice(0, original.history.length), original.history);
  assert.equal(finding.history.length, original.history.length + 1);
  assert.equal(get(data, 'F-003').status, 'closed');
  const reapproved = core.approveFinding(changed, 'F-003', 'Demo reviewer', '2026-10-04T11:00:00Z');
  assert.equal(core.evaluateFinding(get(reapproved, 'F-003'), reapproved).canClose, true);
  const reclosed = core.closeFinding(reapproved, 'F-003', 'Demo coordinator', '2026-10-04T12:00:00Z');
  assert.equal(get(reclosed, 'F-003').status, 'closed');
});

test('all editable fields invalidate approval; a no-op preserves it', () => {
  ['owner', 'dueDate', 'responseDraft', 'effectivenessResult', 'evidenceIds', 'sourceIds'].forEach(field => {
    const data = seed();
    const current = get(data, 'F-006');
    const value = field === 'dueDate' ? '2026-10-12' : field === 'evidenceIds' ? ['E-009'] : field === 'sourceIds' ? ['S-RESPONSE', 'S-AI'] : field === 'effectivenessResult' ? 'New completed result.' : current[field] + ' revised';
    const edited = core.saveFinding(data, current.id, { [field]: value }, 'Demo editor', '2026-10-04T12:00:00Z');
    assert.equal(get(edited, current.id).review.status, 'pending', field);
  });
  const data = seed();
  const same = core.saveFinding(data, 'F-006', { owner: get(data, 'F-006').owner }, 'Demo editor', '2026-10-04T12:00:00Z');
  assert.deepEqual(same, data);
  assert.notEqual(same, data);
});

test('transitions require an actor, explicit valid timestamp and chronological history', () => {
  const data = seed();
  assert.throws(() => core.approveFinding(data, 'F-002', '  ', '2026-10-04T12:00:00Z'), /non-empty/);
  ['2026-10-04', '2026-10-04T12:00:00', '2026-02-30T12:00:00Z', '2026-10-04T24:00:00Z'].forEach(stamp => {
    assert.throws(() => core.approveFinding(data, 'F-002', 'Demo reviewer', stamp), /timestamp/);
  });
  assert.throws(() => core.saveFinding(data, 'F-003', { owner: 'New owner' }, 'Demo editor', '2026-09-01T12:00:00Z'), /earlier/);
  assert.throws(() => core.approveFinding(data, 'UNKNOWN', 'Demo reviewer', '2026-10-04T12:00:00Z'), /Unknown finding/);
  ['id', 'history', 'review', '__proto__'].forEach(field => {
    const patch = JSON.parse('{"' + field + '":"forged"}');
    assert.throws(() => core.saveFinding(data, 'F-001', patch, 'Demo editor', '2026-10-04T12:00:00Z'), /cannot be edited/);
  });
});

test('schema rejects invalid types, impossible dates, unsafe links and invented closed states', () => {
  assert.equal(core.validateDataset(null).valid, false);
  assert.equal(core.validateDataset([]).valid, false);
  const mutations = [
    data => { data.schemaVersion = 2; },
    data => { data.referenceDate = '2026-02-30'; },
    data => { data.findings[0].dueDate = '2026-09-31'; },
    data => { data.findings[0].rootCause = { injected: true }; },
    data => { data.findings[0].severity = 'critical'; },
    data => { data.evidence[0].status = 'complete'; },
    data => { data.sources[0].url = 'javascript:alert(1)'; },
    data => { data.sources[0].url = 'https://user:pass@example.com/'; },
    data => { data.evidence[0].locator = '../private.md'; },
    data => { data.evidence[1].locator = 'evidence/nonexistent.md'; },
    data => { data.findings[2].review.reviewer = ''; },
    data => { data.findings[2].effectivenessResult = ''; },
    data => { data.findings[0].status = 'closed'; },
    data => { data.findings[0].review = { status: 'approved', reviewer: 'Demo reviewer', reviewedAt: '2026-10-04T12:00:00Z' }; },
    data => { data.findings[0].title = 'x'.repeat(20001); },
    data => { data.findings = Array(501).fill(data.findings[0]); },
    data => { data.case.unexpected = 'wrong'; }
  ];
  mutations.forEach((mutate, index) => {
    const data = seed();
    mutate(data);
    assert.equal(core.validateDataset(data).valid, false, 'mutation ' + index);
  });
});

test('imports reject duplicate IDs, duplicate references and dangling references', () => {
  ['findings', 'sources', 'evidence'].forEach(collection => {
    const data = seed();
    data[collection].push(core.clone(data[collection][0]));
    const checked = core.validateDataset(data);
    assert.equal(checked.valid, false);
    assert(checked.errors.some(error => error.includes('duplicate ID')));
  });
  ['evidenceIds', 'sourceIds'].forEach(field => {
    const duplicate = seed();
    duplicate.findings[0][field].push(duplicate.findings[0][field][0]);
    assert(core.validateDataset(duplicate).errors.some(error => error.includes('duplicate reference')));
    const dangling = seed();
    dangling.findings[0][field].push('UNKNOWN');
    assert(core.validateDataset(dangling).errors.some(error => error.includes('unknown reference')));
  });
});

test('empty-case imports are rejected before the UI can select a missing first finding', () => {
  const data = seed();
  data.findings = [];
  const checked = core.validateDataset(data);
  assert.equal(checked.valid, false);
  assert(checked.errors.includes('dataset.findings: must contain at least one finding'));
  assert.throws(() => core.summarise(data), /must contain at least one finding/);
  assert.throws(() => core.markdownReport(data), /must contain at least one finding/);
});

test('CSV neutralises formula starts including whitespace and safely quotes multiline content', () => {
  ['=HYPERLINK("https://example.com")', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '  =1+1', '\t=1+1', '\n=1+1', '\uFEFF=1+1'].forEach(attack => {
    const data = seed();
    data.findings[0].owner = attack;
    const csv = core.csvExport(data, '2026-10-04');
    assert(csv.includes('"\'' + attack.replace(/"/g, '""') + '"'), attack);
  });
  const data = seed();
  data.findings[0].responseDraft = 'A "quoted" line, then\nsecond line';
  const csv = core.csvExport(data);
  assert(csv.includes('"A ""quoted"" line, then\nsecond line"'));
  assert(csv.endsWith('\r\n'));
});

test('internal Markdown report preserves scope and avoids executable HTML', () => {
  const data = seed();
  data.findings[0].title = '<script>alert(1)</script> [unsafe](javascript:bad)';
  const report = core.markdownReport(data, '2026-10-04');
  assert(report.includes('not a regulator submission'));
  assert(report.includes('Attach evidence to a regulatory response only when requested and appropriate.'));
  assert(report.includes('no file available'));
  assert(report.includes('https://www.gov.uk/guidance/guidance-on-responding-to-a-gmpgdp-post-inspection-letter'));
  assert(!report.includes('<script>'));
  assert(!report.includes('[unsafe](javascript:bad)'));
});

test('evidence content matches actual files, and missing entries have no pretend file', () => {
  const data = seed();
  data.evidence.forEach(evidence => {
    if (evidence.status === 'missing') {
      assert.equal(evidence.locator, '');
      assert.equal(evidence.content, '');
      return;
    }
    const stored = fs.readFileSync(path.join(__dirname, '..', evidence.locator), 'utf8');
    assert.equal(stored, evidence.content);
    assert(stored.includes('FICTIONAL TRAINING RECORD'));
  });
});

test('browser globals work without CommonJS or dependencies', () => {
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../data/demo-data.js'), 'utf8'), sandbox);
  assert.equal(typeof sandbox.InspectionCore.closeFinding, 'function');
  assert.equal(sandbox.InspectionCore.validateDataset(sandbox.InspectionDemo.createDataset()).valid, true);
  assert.equal(sandbox.InspectionCore.summarise(sandbox.InspectionDemo.dataset).total, 6);
});
