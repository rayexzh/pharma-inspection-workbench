'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const demo = require('../data/demo-data.js');
const zh = require('../data/demo-zh-CN.js');
const i18n = require('../src/i18n.js');

const findingFields = ['title', 'area', 'description', 'owner', 'rootCause', 'impact', 'interimAction', 'correctiveAction', 'effectivenessPlan', 'effectivenessResult', 'responseDraft'];
const dates = value => value.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/g) || [];
const recordIds = value => value.match(/\b(?:E|F|INV|CTL|CHG|EFF|REF|COM)-\d{3}\b/g) || [];

// This helper assembles a display view only. Its result is never passed to a save transition.
function displayDataset(data, language) {
  const seed = demo.dataset;
  return {
    ...data,
    case: i18n.project(data.case, seed.case, zh.case, language),
    sources: data.sources.map(item => i18n.project(item, seed.sources.find(original => original.id === item.id), zh.sources[item.id], language)),
    evidence: data.evidence.map(item => i18n.project(item, seed.evidence.find(original => original.id === item.id), zh.evidence[item.id], language)),
    findings: data.findings.map(item => i18n.project(item, seed.findings.find(original => original.id === item.id), zh.findings[item.id], language))
  };
}

test('Chinese fixture covers seed display fields without filling missing information', () => {
  const data = demo.createDataset();
  assert.deepEqual(Object.keys(zh.findings).sort(), data.findings.map(item => item.id).sort());
  assert.deepEqual(Object.keys(zh.evidence).sort(), data.evidence.map(item => item.id).sort());
  assert.deepEqual(Object.keys(zh.sources).sort(), data.sources.map(item => item.id).sort());
  for (const key of ['name', 'site', 'description']) assert.equal(typeof zh.case[key], 'string', 'case.' + key);
  for (const finding of data.findings) {
    for (const field of findingFields) {
      assert.equal(typeof zh.findings[finding.id][field], 'string', finding.id + '.' + field);
      if (finding[field] === '') assert.equal(zh.findings[finding.id][field], '', finding.id + '.' + field + ' stays blank');
      else assert(zh.findings[finding.id][field].length > 0, finding.id + '.' + field + ' has a translation');
      assert.deepEqual(dates(zh.findings[finding.id][field]), dates(finding[field]), finding.id + '.' + field + ' dates');
      assert.deepEqual(recordIds(zh.findings[finding.id][field]), recordIds(finding[field]), finding.id + '.' + field + ' IDs');
    }
    for (const entry of finding.history) {
      assert.equal(typeof zh.historyActions[entry.action], 'string', 'seed history action covered');
      assert.equal(typeof zh.historyActors[entry.actor], 'string', 'seed history actor covered');
    }
  }
  for (const evidence of data.evidence) {
    for (const field of ['title', 'summary', 'content']) assert.equal(typeof zh.evidence[evidence.id][field], 'string');
    assert.deepEqual(dates(zh.evidence[evidence.id].content), dates(evidence.content), evidence.id + ' evidence dates');
    assert.deepEqual(recordIds(zh.evidence[evidence.id].content), recordIds(evidence.content), evidence.id + ' evidence IDs');
    if (evidence.status === 'missing') assert.equal(zh.evidence[evidence.id].content, '');
    else assert(zh.evidence[evidence.id].content.includes('虚构培训记录'), 'translated evidence retains its fictional-record disclaimer');
  }
});

test('display projection preserves identifiers, dates, URLs and workflow metadata', () => {
  const data = demo.createDataset();
  const before = JSON.stringify(data);
  const view = displayDataset(data, 'zh-CN');
  assert.notEqual(view.case.name, data.case.name);
  assert.equal(view.schemaVersion, data.schemaVersion);
  assert.equal(view.referenceDate, data.referenceDate);
  assert.equal(view.case.id, data.case.id);
  assert.equal(view.case.inspectionDate, data.case.inspectionDate);
  view.sources.forEach((item, index) => {
    assert.equal(item.id, data.sources[index].id);
    assert.equal(item.url, data.sources[index].url);
    assert.equal(item.checkedOn, data.sources[index].checkedOn);
  });
  view.evidence.forEach((item, index) => {
    for (const key of ['id', 'version', 'status', 'locator']) assert.equal(item[key], data.evidence[index][key]);
  });
  view.findings.forEach((item, index) => {
    for (const key of ['id', 'severity', 'status', 'dueDate']) assert.equal(item[key], data.findings[index][key]);
    for (const key of ['review', 'history', 'evidenceIds', 'sourceIds']) assert.deepEqual(item[key], data.findings[index][key]);
  });
  assert.equal(JSON.stringify(data), before, 'creating a translated view must not modify stored records');
});

test('only fields that still equal the seed are translated; imported and user text remain exact', () => {
  const seed = demo.dataset.findings[0];
  const edited = core.clone(seed);
  edited.title = 'Closed';
  edited.owner = 'Open';
  edited.rootCause = 'My own investigation: no conclusion yet.';
  edited.responseDraft = '客户原文\n  Current  \nDo not alter this text.';
  const before = core.clone(edited);
  const view = i18n.project(edited, seed, zh.findings[seed.id], 'zh-CN');
  assert.equal(i18n.text('Closed', 'zh-CN'), '已关闭', 'Closed is a known UI label');
  assert.equal(i18n.text('Open', 'zh-CN'), '未开始', 'Open is a known UI label');
  for (const field of ['title', 'owner', 'rootCause', 'responseDraft']) assert.equal(view[field], edited[field], field + ' is user text, including known UI phrases');
  assert.equal(view.description, zh.findings[seed.id].description, 'unchanged seed description is displayed in Chinese');
  assert.deepEqual(edited, before);

  const imported = { id: 'IMPORTED-001', title: 'Current', description: 'Open', owner: 'User-entered owner' };
  const importView = i18n.project(imported, undefined, undefined, 'zh-CN');
  assert.deepEqual(importView, imported);
  assert.notEqual(importView, imported);
  assert.deepEqual(i18n.project(edited, seed, undefined, 'zh-CN'), edited, 'missing fixture leaves text exact');
});

test('English and unsupported language views keep original seed and user records', () => {
  const data = demo.createDataset();
  data.findings[0].owner = '中文自定义负责人';
  assert.deepEqual(displayDataset(data, 'en'), data);
  assert.deepEqual(displayDataset(data, 'fr'), data);
  assert.equal(i18n.text('Closed', 'en'), 'Closed');
  assert.equal(i18n.text('Unknown custom label', 'zh-CN'), 'Unknown custom label');
  assert.equal(i18n.text('Source link checked 2026-10-04', 'zh-CN'), '来源链接核对日期 2026-10-04');
});

test('Chinese missing-field and evidence observations preserve codes and projected titles', () => {
  const data = demo.createDataset();
  const finding = data.findings[0];
  const check = core.evaluateFinding(finding, data, data.referenceDate);
  const view = displayDataset(data, 'zh-CN');
  const originalIssues = core.clone(check.issues);
  const localized = check.issues.map(item => i18n.issue(item, view, 'zh-CN'));
  const missingOwner = localized.find(item => item.code === 'missing_owner');
  assert.equal(missingOwner.label, '缺少负责人');
  assert(missingOwner.detail.includes('本案例'));
  assert.equal(localized.find(item => item.code === 'missing_rootCause').label, '缺少根本原因');
  const stale = localized.find(item => item.code === 'evidence_superseded');
  assert(stale.label.includes('E-001'));
  assert(stale.label.includes('已被替代'));
  assert(stale.detail.startsWith(zh.evidence['E-001'].title + '：'));
  assert(stale.detail.includes(zh.evidence['E-001'].summary));
  const missing = localized.find(item => item.code === 'evidence_missing');
  assert(missing.label.includes('E-002'));
  assert(missing.detail.includes(zh.evidence['E-002'].title));
  assert.equal(localized.find(item => item.code === 'overdue').label, '承诺完成日期已过');
  assert.deepEqual(localized.map(item => item.code), check.issues.map(item => item.code));
  assert.deepEqual(check.issues, originalIssues, 'localisation does not overwrite the source observations');
  assert.deepEqual(i18n.issue(check.issues[0], data, 'en'), check.issues[0]);
});

test('localized issues use edited evidence titles without translating their user wording', () => {
  const data = demo.createDataset();
  data.evidence[0].title = 'Open';
  data.evidence[0].summary = 'Customer wording: keep this summary exact.';
  const view = displayDataset(data, 'zh-CN');
  const issue = core.evaluateFinding(data.findings[0], data).issues.find(item => item.code === 'evidence_superseded');
  const localized = i18n.issue(issue, view, 'zh-CN');
  assert.equal(view.evidence[0].title, 'Open');
  assert.equal(localized.detail, 'Open：Customer wording: keep this summary exact.');
});

test('history is localized for display without changing actor records or timestamps', () => {
  const data = demo.createDataset();
  const history = data.findings.find(item => item.id === 'F-003').history;
  const before = core.clone(history);
  for (const entry of history) {
    const translated = i18n.history(entry, zh, 'zh-CN');
    assert.equal(translated.timestamp, entry.timestamp);
    assert.equal(translated.action, zh.historyActions[entry.action]);
    assert.equal(translated.actor, zh.historyActors[entry.actor]);
    assert.deepEqual(i18n.history(entry, zh, 'en'), entry);
  }
  const edit = { timestamp: '2026-10-04T12:00:00.000Z', actor: 'Demo editor', action: 'Edited rootCause, responseDraft; previous technical approval reset.' };
  const translatedEdit = i18n.history(edit, zh, 'zh-CN');
  assert.equal(translatedEdit.timestamp, edit.timestamp);
  assert.equal(translatedEdit.actor, '演示编辑者');
  assert(translatedEdit.action.includes('根本原因'));
  assert(translatedEdit.action.includes('回复草稿'));
  assert(translatedEdit.action.includes('原技术复核已失效'));
  assert.equal(edit.action, 'Edited rootCause, responseDraft; previous technical approval reset.');
  assert.deepEqual(history, before);
});

test('language-only projection preserves approved closure, audit timestamps and exports', () => {
  const data = demo.createDataset();
  const original = core.clone(data);
  const closed = data.findings.find(item => item.id === 'F-003');
  const review = core.clone(closed.review);
  const timestamps = closed.history.map(entry => entry.timestamp);
  const summary = core.summarise(data);
  const csv = core.csvExport(data);
  const report = core.markdownReport(data);
  for (const language of ['zh-CN', 'en', 'zh-CN', 'en']) {
    const view = displayDataset(data, language);
    const displayClosed = view.findings.find(item => item.id === closed.id);
    const displayHistory = closed.history.map(entry => i18n.history(entry, zh, language));
    assert.deepEqual(displayClosed.review, review);
    assert.equal(displayClosed.status, 'closed');
    assert.deepEqual(displayHistory.map(entry => entry.timestamp), timestamps);
  }
  assert.deepEqual(data, original, 'a language switch must never save display text into core state');
  assert.equal(closed.review.status, 'approved');
  assert.equal(core.evaluateFinding(closed, data).canClose, true);
  assert.deepEqual(core.summarise(data), summary);
  assert.equal(core.csvExport(data), csv, 'exports keep exact stored original text');
  assert.equal(core.markdownReport(data), report);
});
