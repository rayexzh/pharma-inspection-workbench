'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Guidance = require('../src/guidance.js');
const fields = ['owner', 'dueDate', 'rootCause', 'impact', 'interimAction', 'correctiveAction', 'effectivenessPlan', 'effectivenessResult', 'responseDraft'];

test('each editable writing field has compact English and Chinese question cards', () => {
  for (const field of fields) {
    const en = Guidance.forField(field, 'en');
    const zh = Guidance.forField(field, 'zh-CN');
    for (const card of [en, zh]) {
      assert.deepEqual(Object.keys(card), ['title', 'purpose', 'prompts', 'avoid']);
      for (const property of ['title', 'purpose', 'avoid']) assert.ok(typeof card[property] === 'string' && card[property].trim());
      assert.ok(card.prompts.length >= 2 && card.prompts.length <= 3);
      assert.ok(card.prompts.every(prompt => typeof prompt === 'string' && /[?？]$/.test(prompt)));
    }
    assert.ok(/[\u4e00-\u9fff]/.test(zh.purpose), field + ' has Chinese text');
    assert.notEqual(en.purpose, zh.purpose);
    assert.ok([en.title, en.purpose, ...en.prompts, en.avoid, zh.title, zh.purpose, ...zh.prompts, zh.avoid].join(' ').split(/\s+/).length <= 180);
  }
});

test('unknown fields cannot accidentally expose prototype properties', () => {
  for (const name of ['status', 'review', 'unknown', '__proto__', 'constructor', 'toString', '', null, undefined, {}, ['rootCause']]) {
    assert.equal(Guidance.forField(name, 'en'), null);
  }
});

test('only the explicit Chinese locale changes language, with predictable English fallback', () => {
  for (const field of fields) {
    const expected = Guidance.forField(field, 'en');
    for (const language of [undefined, null, 'fr', 'zh', 'ZH-CN', '', {}]) assert.deepEqual(Guidance.forField(field, language), expected);
  }
  assert.equal(Guidance.forField('rootCause', 'zh-CN').title, '根本原因');
});

test('editing a returned card cannot change later cards or other field guidance', () => {
  for (const language of ['en', 'zh-CN']) {
    const before = fields.map(field => Guidance.forField(field, language));
    const edited = Guidance.forField('rootCause', language);
    edited.title = 'changed';
    edited.purpose = 'changed';
    edited.avoid = 'changed';
    edited.prompts[0] = 'changed';
    edited.prompts.push('changed');
    assert.deepEqual(fields.map(field => Guidance.forField(field, language)), before);
  }
});

test('guidance keeps investigation uncertainty and completed-check evidence explicit in both languages', () => {
  const causeEn = Guidance.forField('rootCause', 'en');
  const causeZh = Guidance.forField('rootCause', 'zh-CN');
  assert.match(causeEn.prompts.join(' '), /untested or uncertain/);
  assert.match(causeZh.prompts.join(' '), /尚未验证或仍不确定/);
  const resultEn = Guidance.forField('effectivenessResult', 'en');
  const resultZh = Guidance.forField('effectivenessResult', 'zh-CN');
  assert.match(resultEn.prompts.join(' '), /method, date, sample or period/);
  assert.match(resultEn.prompts.join(' '), /supporting record/);
  assert.match(resultEn.avoid, /future check is a plan, not a result/);
  assert.match(resultZh.prompts.join(' '), /实际使用了什么方法/);
  assert.match(resultZh.prompts.join(' '), /支持记录在哪里/);
  assert.match(resultZh.avoid, /计划，不是结果/);
  assert.deepEqual(Object.keys(Guidance), ['forField'], 'there is no auto-fill or drafting API');
});

test('the standalone browser module exposes the same prompts without a CommonJS dependency', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/guidance.js'), 'utf8'), context);
  assert.equal(typeof context.InspectionGuidance.forField, 'function');
  for (const field of fields) {
    for (const language of ['en', 'zh-CN']) {
      assert.deepEqual(JSON.parse(JSON.stringify(context.InspectionGuidance.forField(field, language))), Guidance.forField(field, language));
    }
  }
  assert.equal(context.InspectionGuidance.forField('unknown'), null);
});
