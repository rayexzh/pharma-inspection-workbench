'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../src/core.js');
const Demo = require('../data/demo-data.js');
const Drafts = require('../src/drafts.js');
const timestamp = '2026-10-05T10:30:00.000Z';
const metadata = {tab:'response',language:'zh-CN',updatedAt:timestamp};
const finding = (data,id='F-006') => data.findings.find(item=>item.id===id);
const create = (data,patch={responseDraft:'中文修改：等待主管核对。'},id='F-006') => Drafts.createDraft(data,id,patch,metadata);

test('draft creation and JSON recovery preserve canonical approval, history and exact non-ASCII text', () => {
  const data=Demo.createDataset(), before=Core.clone(data);
  const patch={responseDraft:'  复核稿：温度 ≤ 8°C，µg 数据待核对。\nSecond line.  ',effectivenessResult:''};
  const draft=create(data,patch);
  assert(draft.baseFingerprint.length<50,'fingerprint must not duplicate the case and reference text in local storage');
  const result=Drafts.validateDraft(JSON.parse(JSON.stringify(draft)),data);
  assert.equal(result.valid,true);
  assert.equal(result.reason,'valid');
  assert.deepEqual(result.draft.patch,patch);
  assert.deepEqual(data,before);
  assert.equal(finding(data).review.status,'approved');
  result.draft.patch.responseDraft='Returned copies can change independently.';
  patch.responseDraft='The caller owns its original patch.';
  assert.notEqual(draft.patch.responseDraft,patch.responseDraft);
  assert.notEqual(draft.patch.responseDraft,result.draft.patch.responseDraft);
  assert.deepEqual(data,before);
});

test('incomplete draft fields and empty reference selections remain recoverable without being approved', () => {
  const data=Demo.createDataset();
  const draft=create(data,{owner:'',dueDate:'',rootCause:'',evidenceIds:[],sourceIds:[]},'F-001');
  assert.equal(Drafts.validateDraft(draft,data).valid,true);
  assert.equal(Core.evaluateFinding(finding(data,'F-001'),data).canApprove,false);
  assert.equal(finding(data,'F-001').owner,'');
});

test('changed finding content, named review or history makes the old recovery draft stale', () => {
  const original=Demo.createDataset(), draft=create(original);
  const changed=Core.saveFinding(original,'F-006',{owner:'Changed saved owner'},'Demo editor',timestamp);
  assert.deepEqual(Drafts.validateDraft(draft,changed),{valid:false,reason:'stale'});
  const review=Core.clone(original);
  finding(review).review.reviewer='Another demo reviewer';
  assert.deepEqual(Drafts.validateDraft(draft,review),{valid:false,reason:'stale'});
  const history=Core.clone(original);
  finding(history).history.push({timestamp,actor:'Demo editor',action:'Imported new local event.'});
  assert.deepEqual(Drafts.validateDraft(draft,history),{valid:false,reason:'stale'});
  assert.equal(Drafts.validateDraft(draft,original).valid,true);
});

test('changed imported case, evidence content, evidence status or source metadata cannot receive an old draft', () => {
  const original=Demo.createDataset(), draft=create(original);
  const changes=[
    data=>{data.case.id='ANOTHER-CASE';},
    data=>{data.case.description+=' Additional imported scope.';},
    data=>{data.evidence.find(item=>item.id==='E-009').content+=' Imported revision.';},
    data=>{data.evidence.find(item=>item.id==='E-001').status='current';},
    data=>{data.sources[0].title+=' Revised source title';}
  ];
  for(const change of changes){
    const imported=Core.clone(original); change(imported);
    assert.equal(Core.validateDataset(imported).valid,true);
    assert.deepEqual(Drafts.validateDraft(draft,imported),{valid:false,reason:'stale'});
  }
});

test('key ordering, reference register ordering and edits to another finding do not produce false stale matches', () => {
  const original=Demo.createDataset(), draft=create(original);
  const reordered=Core.clone(original);
  reordered.evidence.reverse(); reordered.sources.reverse();
  reordered.case=Object.fromEntries(Object.entries(reordered.case).reverse());
  reordered.findings[5]=Object.fromEntries(Object.entries(reordered.findings[5]).reverse());
  reordered.referenceDate='2026-10-06';
  assert.equal(Drafts.validateDraft(draft,reordered).valid,true);
  const another=Core.saveFinding(reordered,'F-001',{owner:'Different saved editor'},'Demo editor',timestamp);
  assert.equal(Drafts.validateDraft(draft,another).valid,true);
});

test('patches reject read-only or unknown keys, malformed values, duplicate IDs and dangling references atomically', () => {
  const data=Demo.createDataset(), before=Core.clone(data);
  const bad=[{},null,[],{review:{status:'approved'}},{id:'F-003'},{title:'Cannot edit the finding identity here'},
    {rootCause:1},{owner:'x'.repeat(20001)},{dueDate:'2026-02-30'},{dueDate:'2026-2-2'},
    {status:'invalid'},{status:'closed'},{evidenceIds:['E-009','E-009']},{evidenceIds:['MISSING']},
    {sourceIds:['S-RESPONSE','S-RESPONSE']},{sourceIds:[3]},{sourceIds:'S-RESPONSE'},
    JSON.parse('{"__proto__":{"polluted":true},"owner":"x"}')];
  for(const patch of bad){
    assert.throws(()=>create(data,patch),/Invalid recovery draft patch/);
    const envelope=create(data);
    envelope.patch=patch;
    assert.deepEqual(Drafts.validateDraft(envelope,data),{valid:false,reason:'invalid'});
    assert.deepEqual(data,before);
  }
  assert.equal({}.polluted,undefined);
});

test('malformed envelope, metadata, impossible timestamp and invalid dataset are safely rejected', () => {
  const data=Demo.createDataset();
  const bad=[{},[],1,'draft',{...create(data),version:2},{...create(data),extra:true},
    {...create(data),findingId:'../F-006'},{...create(data),baseFingerprint:''},
    {...create(data),language:'fr'},{...create(data),tab:'unsupported'},
    {...create(data),updatedAt:'2026-02-30T10:00:00Z'},
    {...create(data),updatedAt:'2026-10-05T24:00:00Z'},
    {...create(data),updatedAt:'2026-10-05T10:00:00'}];
  for(const envelope of bad) assert.deepEqual(Drafts.validateDraft(envelope,data),{valid:false,reason:'invalid'});
  for(const meta of [{},{...metadata,tab:'history'},{...metadata,extra:true},{...metadata,updatedAt:'2026-10-05'}]){
    assert.throws(()=>Drafts.createDraft(data,'F-006',{owner:'Draft owner'},meta));
  }
  assert.throws(()=>create(data,{owner:'Draft owner'},'MISSING'),/existing finding/);
  assert.throws(()=>create({},{}),/valid canonical dataset/);
  assert.deepEqual(Drafts.validateDraft(create(data),{}),{valid:false,reason:'invalid'});
});

test('absent envelopes and removed findings are missing; a changed case is stale even if its finding ID is absent', () => {
  const data=Demo.createDataset(), draft=create(data);
  assert.deepEqual(Drafts.validateDraft(null,data),{valid:false,reason:'missing'});
  assert.deepEqual(Drafts.validateDraft(undefined,data),{valid:false,reason:'missing'});
  const removed=Core.clone(data); removed.findings=removed.findings.filter(item=>item.id!=='F-006');
  assert.deepEqual(Drafts.validateDraft(draft,removed),{valid:false,reason:'missing'});
  removed.case.id='ANOTHER-CASE';
  assert.deepEqual(Drafts.validateDraft(draft,removed),{valid:false,reason:'stale'});
});

test('draft status cannot close open work; an edited closed record still needs the normal canonical save transition', () => {
  const data=Demo.createDataset();
  const draft=create(data,{status:'closed',rootCause:'A local unsaved change.'},'F-003');
  assert.equal(Drafts.validateDraft(draft,data).valid,true);
  assert.equal(finding(data,'F-003').status,'closed');
  assert.equal(finding(data,'F-003').review.status,'approved');
  const saved=Core.saveFinding(data,'F-003',draft.patch,'Demo editor',timestamp);
  assert.equal(finding(saved,'F-003').status,'in_progress');
  assert.equal(finding(saved,'F-003').review.status,'pending');
  assert.equal(Drafts.validateDraft(draft,saved).reason,'stale');
});

test('browser module exposes the same pure recovery API and has no DOM or storage dependency', () => {
  const context=vm.createContext({InspectionCore:Core});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/drafts.js'),'utf8'),context);
  const data=Demo.createDataset();
  context.data=data; context.timestamp=timestamp;
  const result=vm.runInContext(`
    const draft = InspectionDrafts.createDraft(data, 'F-006', {owner:'浏览器草稿'}, {updatedAt:timestamp});
    InspectionDrafts.validateDraft(draft, data);
  `,context);
  assert.equal(result.valid,true);
  assert.equal(result.draft.patch.owner,'浏览器草稿');
  assert.equal(result.draft.tab,'plan');
  assert.equal(result.draft.language,'zh-CN');
  assert.equal(finding(data).owner,Demo.createDataset().findings[5].owner);
});
