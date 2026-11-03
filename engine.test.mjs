import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPreview, exportPlan } from './engine.mjs';

const sample = JSON.parse(readFileSync(new URL('./sample.json', import.meta.url), 'utf8'));

test('previews valid updates and blocks invalid records', () => {
  const result = buildPreview(sample);
  assert.deepEqual(result.map(item => item.status), ['ready', 'error', 'error', 'ready', 'error']);
  assert.deepEqual(result[0].updates, [{ id: 11, value: 'Альфа' }, { id: 12, value: 'hello@alfa.ru' }, { id: 13, value: 15500 }]);
  assert.deepEqual(result[1].updates, []);
  assert.deepEqual(result[3].updates, [{ id: 11, value: 'Дельта' }, { id: 12, value: 'mail@delta.ru' }]);
});

test('export contains only valid dry-run operations', () => {
  const plan = exportPlan(sample, buildPreview(sample));
  assert.equal(plan.dry_run, true);
  assert.equal(plan.operations.length, 2);
  assert.equal(plan.operations[0].path, '/tasks/1001/comments');
});
