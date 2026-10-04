'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../src/core.js');
const Demo = require('../data/demo-data.js');
const I18n = require('../src/i18n.js');
const Zh = require('../data/demo-zh-CN.js');
const fields = {title:'虚构：交接记录未签名',area:'培训与文件',description:'模拟抽样中两份交接记录未填写签名，原因尚未查明。'};
const timestamp = '2026-10-04T10:00:00.000Z';

test('a new training finding stays incomplete and leaves existing approvals untouched', () => {
  const original = Demo.createDataset();
  const snapshot = Core.clone(original);
  const next = Core.addFinding(original,fields,'Demo editor',timestamp);
  assert.deepEqual(original,snapshot);
  assert.deepEqual(next.findings.slice(0,6),original.findings);
  const finding = next.findings.at(-1);
  assert.equal(finding.id,'F-007');
  assert.equal(finding.title,fields.title);
  assert.equal(finding.status,'open');
  assert.equal(finding.review.status,'pending');
  assert.deepEqual(finding.evidenceIds,[]);
  assert.deepEqual(finding.sourceIds,[]);
  assert.equal(finding.rootCause,'');
  assert.equal(finding.history[0].timestamp,timestamp);
  assert.equal(Core.validateDataset(next).valid,true);
  const check = Core.evaluateFinding(finding,next);
  assert.equal(check.canApprove,false);
  assert.equal(check.canClose,false);
  assert.throws(()=>Core.approveFinding(next,finding.id,'Reviewer',timestamp),/Cannot approve/);
});

test('creation finds an unused ID and rejects malformed or preapproved inputs atomically', () => {
  const original = Demo.createDataset();
  const first = Core.addFinding(original,fields,'Editor',timestamp);
  const second = Core.addFinding(first,{...fields,severity:'major',owner:'演示负责人',dueDate:'2026-10-15'},'Editor',timestamp);
  assert.equal(second.findings.at(-1).id,'F-008');
  assert.equal(second.findings.at(-1).dueDate,'2026-10-15');
  const snapshot = Core.clone(original);
  for (const patch of [{title:' '},{description:''},{area:''},{dueDate:'2026-02-30'},{severity:'critical'},{owner:0},{status:'closed'},{review:{status:'approved'}}]) {
    assert.throws(()=>Core.addFinding(original,{...fields,...patch},'Editor',timestamp));
    assert.deepEqual(original,snapshot);
  }
  assert.throws(()=>Core.addFinding(original,fields,' ',timestamp));
  assert.throws(()=>Core.addFinding(original,fields,'Editor','2026-10-04'));
});

test('unknown imported history text is preserved even when it matches a UI label', () => {
  const entry = {timestamp,actor:'自定义人员',action:'Open'};
  assert.deepEqual(I18n.history(entry,Zh,'zh-CN'),entry);
});
