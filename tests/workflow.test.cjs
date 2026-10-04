'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../src/core.js');
const Demo = require('../data/demo-data.js');
const Workflow = require('../src/workflow.js');
const get = (data, id) => data.findings.find(item => item.id === id);

test('work-list dates use canonical overdue rules and a separate exact due-today boundary', () => {
  const data = Demo.createDataset();
  const first = Workflow.classifyFinding(get(data, 'F-001'), data, '2026-10-04', Core);
  assert.equal(first.priority, 'overdue');
  assert.equal(first.dueToday, false);
  assert.equal(first.nextCode, 'missing_owner', 'overdue never masks a missing plan field');
  assert.equal(first.stage, 'plan');
  const today = Workflow.classifyFinding(get(data, 'F-006'), data, '2026-10-04', Core);
  assert.equal(today.priority, 'due_today');
  assert.equal(today.dueToday, true);
  assert.equal(today.nextCode, 'missing_effectivenessResult');
  assert.equal(Workflow.classifyFinding(get(data, 'F-006'), data, '2026-10-03', Core).priority, 'in_progress');
  assert.equal(Workflow.classifyFinding(get(data, 'F-006'), data, '2026-10-05', Core).priority, 'overdue');
  assert.throws(() => Workflow.classifyFinding(get(data, 'F-006'), data, '2026-02-30', Core), /Reference date/);
});

test('classification carries canonical gates and distinguishes overdue information from closure blockers', () => {
  const data = Demo.createDataset();
  for (const finding of data.findings) {
    const canonical = Core.evaluateFinding(finding, data, data.referenceDate);
    const state = Workflow.classifyFinding(finding, data, data.referenceDate, Core);
    assert.equal(state.canApprove, canonical.canApprove);
    assert.equal(state.canClose, canonical.canClose);
    assert.equal(state.evidenceGaps, canonical.evidenceGaps);
    assert.equal(state.sourceGaps, canonical.sourceGaps);
    assert.equal(state.issuescount, canonical.issues.length);
    assert.equal(state.issuesCount, canonical.issues.length);
    assert.equal(state.blockingCount, canonical.issues.filter(issue => issue.code !== 'overdue').length);
  }
  const closed = Workflow.classifyFinding(get(data, 'F-003'), data, '2026-10-20', Core);
  assert.equal(closed.priority, 'closed');
  assert.equal(closed.nextCode, 'history');
  assert.equal(closed.stage, 'history');
  assert.equal(closed.isOpen, false);
  assert.equal(closed.actionable, false);
  assert.equal(closed.dueToday, false);
});

test('required fields precede references, then review, completed effectiveness and closure', () => {
  const data = Demo.createDataset();
  const open = get(data, 'F-002');
  open.rootCause = '';
  open.evidenceIds = [];
  assert.equal(Workflow.classifyFinding(open, data, data.referenceDate, Core).nextCode, 'missing_rootCause');
  open.rootCause = 'A synthetic cause supported by the fictional investigation.';
  assert.equal(Workflow.classifyFinding(open, data, data.referenceDate, Core).nextCode, 'no_evidence');
  assert.equal(Workflow.classifyFinding(open, data, data.referenceDate, Core).stage, 'evidence');
  open.evidenceIds = ['E-003'];
  open.sourceIds = [];
  assert.equal(Workflow.classifyFinding(open, data, data.referenceDate, Core).nextCode, 'no_source');
  open.sourceIds = ['S-INVESTIGATION'];
  const reviewReady = Workflow.classifyFinding(open, data, data.referenceDate, Core);
  assert.equal(reviewReady.priority, 'review_ready');
  assert.equal(reviewReady.canApprove, true, 'core permits review before a future result');
  assert.equal(reviewReady.nextCode, 'missing_review', 'review-ready priority offers a matching review cue');
  assert.equal(reviewReady.stage, 'response');
  assert.equal(reviewReady.summaryKey, 'Review the response');
  const approved = Core.approveFinding(data, open.id, 'Demo reviewer', '2026-10-04T12:00:00Z');
  const pendingResult = Workflow.classifyFinding(get(approved, open.id), approved, data.referenceDate, Core);
  assert.equal(pendingResult.nextCode, 'missing_effectivenessResult');
  assert.equal(pendingResult.stage, 'plan');
  const withResult = Core.saveFinding(approved, open.id, { effectivenessResult: 'Synthetic completed outcome against predefined acceptance criteria.' }, 'Demo editor', '2026-10-04T13:00:00Z');
  assert.equal(Workflow.classifyFinding(get(withResult, open.id), withResult, data.referenceDate, Core).nextCode, 'missing_review', 'a later result edit prompts renewed review');
  const reapproved = Core.approveFinding(withResult, open.id, 'Demo reviewer', '2026-10-04T14:00:00Z');
  const ready = Workflow.classifyFinding(get(reapproved, open.id), reapproved, data.referenceDate, Core);
  assert.equal(ready.canClose, true);
  assert.equal(ready.nextCode, 'close');
  assert.equal(ready.stage, 'close');
});

test('a missing response draft navigates to the response stage', () => {
  const data = Demo.createDataset();
  const finding = get(data, 'F-002');
  finding.responseDraft = '';
  const state = Workflow.classifyFinding(finding, data, data.referenceDate, Core);
  assert.equal(state.nextCode, 'missing_responseDraft');
  assert.equal(state.stage, 'response');
});

test('focus filters overlap, distinguish evidence from source gaps and exclude closed action queues', () => {
  const data = Demo.createDataset();
  const ids = focus => data.findings.filter(finding => Workflow.matchesFocus(finding, data, data.referenceDate, Core, focus)).map(item => item.id);
  assert.deepEqual(ids('all'), ['F-001', 'F-002', 'F-003', 'F-004', 'F-005', 'F-006']);
  assert.deepEqual(ids('open'), ['F-001', 'F-002', 'F-004', 'F-005', 'F-006']);
  assert.deepEqual(ids('overdue'), ['F-001']);
  assert.deepEqual(ids('due_today'), ['F-006']);
  assert.deepEqual(ids('evidence_gap'), ['F-001', 'F-004']);
  assert.deepEqual(ids('review_ready'), ['F-002', 'F-005']);
  get(data, 'F-002').dueDate = '2026-09-30';
  assert.equal(Workflow.matchesFocus(get(data, 'F-002'), data, data.referenceDate, Core, 'overdue'), true);
  assert.equal(Workflow.matchesFocus(get(data, 'F-002'), data, data.referenceDate, Core, 'review_ready'), true);
  get(data, 'F-005').sourceIds = [];
  assert.equal(Workflow.matchesFocus(get(data, 'F-005'), data, data.referenceDate, Core, 'evidence_gap'), false, 'evidence metric excludes a source-only gap');
  assert.equal(Workflow.matchesFocus(get(data, 'F-005'), data, data.referenceDate, Core, 'reference_gap'), true);
  assert.equal(Workflow.classifyFinding(get(data, 'F-005'), data, data.referenceDate, Core).priority, 'evidence_gap');
  assert.equal(Workflow.classifyFinding(get(data, 'F-005'), data, data.referenceDate, Core).labelKey, 'Reference gap');
  const closed = get(data, 'F-003');
  for (const focus of ['open', 'overdue', 'due_today', 'evidence_gap', 'reference_gap', 'review_ready']) assert.equal(Workflow.matchesFocus(closed, data, closed.dueDate, Core, focus), false, focus);
});

test('priority sorting is immutable, deadline-aware within a priority, and closed last', () => {
  const data = Demo.createDataset();
  const input = data.findings.slice().reverse();
  const beforeInput = input.map(item => item.id);
  const beforeData = JSON.stringify(data);
  const sorted = Workflow.sortFindings(input, data, data.referenceDate, Core, 'priority');
  assert.deepEqual(sorted.map(item => item.id), ['F-001', 'F-006', 'F-004', 'F-005', 'F-002', 'F-003']);
  assert.deepEqual(input.map(item => item.id), beforeInput);
  assert.equal(JSON.stringify(data), beforeData);
  assert.notEqual(sorted, input);
  assert.equal(sorted.find(item => item.id === 'F-001'), get(data, 'F-001'), 'sorting returns existing records without rewriting them');
  get(data, 'F-002').dueDate = get(data, 'F-005').dueDate;
  assert.deepEqual(Workflow.sortFindings([get(data, 'F-005'), get(data, 'F-002')], data, data.referenceDate, Core, 'priority').map(item => item.id), ['F-002', 'F-005'], 'ID provides a deterministic tie break');
});

test('deadline sort puts unset dates last and ID sort is independent of priority', () => {
  const data = Demo.createDataset();
  get(data, 'F-004').dueDate = '';
  assert.deepEqual(Workflow.sortFindings(data.findings, data, data.referenceDate, Core, 'due_date').map(item => item.id), ['F-001', 'F-003', 'F-006', 'F-005', 'F-002', 'F-004']);
  assert.deepEqual(Workflow.sortFindings(data.findings.slice().reverse(), data, data.referenceDate, Core, 'id').map(item => item.id), data.findings.map(item => item.id));
  const equal = get(data, 'F-002');
  const duplicatePosition = [equal, equal];
  assert.deepEqual(Workflow.sortFindings(duplicatePosition, data, data.referenceDate, Core, 'priority'), duplicatePosition, 'identical IDs preserve input position');
  assert.deepEqual(Workflow.sortFindings([], data, data.referenceDate, Core, 'priority'), []);
  assert.throws(() => Workflow.sortFindings(data.findings, data, data.referenceDate, Core, 'severity_risk'), /Unknown finding sort/);
  assert.throws(() => Workflow.matchesFocus(equal, data, data.referenceDate, Core, 'compliant'), /Unknown finding focus/);
});

test('reference relationships are explicit ID links and include closed records', () => {
  const data = Demo.createDataset();
  const before = JSON.stringify(data);
  assert.deepEqual(Workflow.relatedFindings(data, 'E-004').map(item => item.id), ['F-002', 'F-006']);
  assert.deepEqual(Workflow.relatedFindings(data, 'E-006').map(item => item.id), ['F-003']);
  assert.deepEqual(Workflow.relatedFindings(data, 'UNKNOWN'), []);
  assert.equal(JSON.stringify(data), before);
});

test('current but unrelated evidence can pass only completeness; no relevance or regulatory claim is inferred', () => {
  const data = Demo.createDataset();
  const finding = get(data, 'F-002');
  finding.evidenceIds = ['E-008']; // Citation checklist does not establish alarm-control adequacy.
  const canonical = Core.evaluateFinding(finding, data, data.referenceDate);
  const state = Workflow.classifyFinding(finding, data, data.referenceDate, Core);
  assert.equal(canonical.canApprove, true);
  assert.equal(state.canApprove, canonical.canApprove);
  assert.equal(state.evidenceGaps, 0);
  assert.equal(state.canClose, false);
  assert.equal(state.nextCode, 'missing_review');
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'compliant'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'regulatoryRisk'), false);
  const linked = canonical.issues.find(item => item.code === 'missing_review');
  assert(linked.detail.includes('cannot assess their competence or authority'));
});

test('classification uses the passed canonical evaluator rather than a duplicate gate implementation', () => {
  const data = Demo.createDataset();
  const finding = get(data, 'F-002');
  let count = 0;
  const canonicalAdapter = {
    evaluateFinding(item, dataset, date) {
      count += 1;
      assert.equal(item, finding);
      assert.equal(dataset, data);
      assert.equal(date, data.referenceDate);
      return Core.evaluateFinding(item, dataset, date);
    }
  };
  const state = Workflow.classifyFinding(finding, data, undefined, canonicalAdapter);
  assert.equal(count, 1);
  assert.equal(state.canApprove, true);
  assert.equal(Workflow.classifyFinding(finding, data).priority, state.priority, 'CommonJS core fallback works');
});

test('browser workflow global works with the already loaded core and no DOM', () => {
  const sandbox = { URL };
  vm.createContext(sandbox);
  for (const file of ['src/core.js', 'data/demo-data.js', 'src/workflow.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  assert.equal(typeof sandbox.InspectionWorkflow.sortFindings, 'function');
  const data = sandbox.InspectionDemo.createDataset();
  const state = sandbox.InspectionWorkflow.classifyFinding(data.findings[0], data, data.referenceDate);
  assert.equal(state.priority, 'overdue');
  assert.equal(state.nextCode, 'missing_owner');
});
