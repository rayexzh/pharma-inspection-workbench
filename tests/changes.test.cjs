'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../src/core.js');
const Demo = require('../data/demo-data.js');
const get = (data,id='F-003') => data.findings.find(item=>item.id===id);
const time = '2026-10-05T01:00:00Z';

test('preview preserves data and predicts the final saved changes including automatic reopening',()=>{
  const data=Demo.createDataset();const original=JSON.stringify(data);
  const patch={owner:'练习负责人 / owner'};
  const preview=Core.previewChanges(data,'F-003',patch);
  assert.equal(JSON.stringify(data),original);
  assert.equal(preview.reviewReset,true);assert.equal(preview.reopensClosed,true);
  assert(preview.changes.some(c=>c.field==='status' && c.before==='closed' && c.after==='in_progress'));
  const saved=Core.saveFinding(data,'F-003',patch,'Demo editor',time);
  assert.deepEqual(get(saved).history.at(-1).changes,preview.changes);
  assert.equal(get(saved).history.length,get(data).history.length+1);
  assert.deepEqual(get(saved).history.slice(0,-1),get(data).history);
});
test('no-op previews and saves do not create snapshots or invalidate approval',()=>{
  const data=Demo.createDataset();const item=get(data);
  assert.deepEqual(Core.previewChanges(data,item.id,{owner:item.owner}),{changes:[],reviewReset:false,reopensClosed:false});
  assert.deepEqual(Core.saveFinding(data,item.id,{owner:item.owner},'Demo editor',time),data);
});
test('saved snapshots preserve exact multiline text and reference arrays without aliasing caller patches',()=>{
  const data=Demo.createDataset();const patch={responseDraft:'正文\n<script>literal</script> =TEXT',evidenceIds:['E-003']};
  const saved=Core.saveFinding(data,'F-002',patch,'Demo editor',time);
  const entry=get(saved,'F-002').history.at(-1);
  assert.equal(entry.changes.find(c=>c.field==='responseDraft').after,patch.responseDraft);
  assert.deepEqual(entry.changes.find(c=>c.field==='evidenceIds').before,['E-003','E-004']);
  patch.evidenceIds.push('E-005');assert.deepEqual(entry.changes.find(c=>c.field==='evidenceIds').after,['E-003']);
  const report=Core.markdownReport(saved);
  assert(report.includes('Before:'));assert(report.includes('After:'));
  assert(report.includes('&lt;script&gt;literal&lt;/script&gt;'));assert(!report.includes('<script>'));
});
test('old JSON backups remain valid and new snapshots survive an exact JSON round trip',()=>{
  const data=Demo.createDataset();assert(Core.validateDataset(data).valid);
  const saved=Core.saveFinding(data,'F-002',{owner:'New fictional owner'},'Demo editor',time);
  const round=JSON.parse(JSON.stringify(saved));assert(Core.validateDataset(round).valid);assert.deepEqual(round,saved);
  assert(!('changes' in get(data,'F-002').history[0]));
});
test('malformed history comparisons are rejected instead of trusted as structured snapshots',()=>{
  const base=Core.saveFinding(Demo.createDataset(),'F-002',{owner:'New owner'},'Demo editor',time);
  for(const changes of [[],null,[{field:'review',before:'pending',after:'approved'}],
    [{field:'owner',before:'same',after:'same'}],
    [{field:'owner',before:'old',after:'new',extra:true}],
    [{field:'owner',before:[],after:'new'}],
    [{field:'owner',before:'a',after:'b'},{field:'owner',before:'b',after:'c'}],
    [{field:'dueDate',before:'2026-02-30',after:''}],
    [{field:'status',before:'closed',after:'approved'}],
    [{field:'evidenceIds',before:[],after:['E-001','E-001']}],
    [{field:'sourceIds',before:[],after:['<img>']}],
    [{field:'owner',before:'a',after:'x'.repeat(20001)}]]) {
      const data=Core.clone(base);get(data,'F-002').history.at(-1).changes=changes;
      assert.equal(Core.validateDataset(data).valid,false,JSON.stringify(changes).slice(0,90));
    }
});
test('historical reference snapshots can retain removed IDs without becoming current evidence links',()=>{
  const data=Core.saveFinding(Demo.createDataset(),'F-002',{owner:'New owner'},'Demo editor',time);
  get(data,'F-002').history.at(-1).changes=[{field:'evidenceIds',before:['ARCHIVED-ID'],after:[]}];
  assert(Core.validateDataset(data).valid);
  assert.deepEqual(get(data,'F-002').evidenceIds,['E-003','E-004']);
});
test('previews reject read-only changes, bad references and attempted premature closure atomically',()=>{
  const data=Demo.createDataset();const original=JSON.stringify(data);
  for(const patch of [{review:{status:'approved'}},{status:'closed'},{dueDate:'2026-02-30'},{evidenceIds:['UNKNOWN']},{owner:42}]) assert.throws(()=>Core.previewChanges(data,'F-002',patch));
  assert.equal(JSON.stringify(data),original);
});
