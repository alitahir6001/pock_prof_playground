import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailAllowed } from '../../src/modules/pilot/emailAllowlist.js';

test('an empty list leaves signup open', () => {
  assert.equal(isEmailAllowed('anyone@example.test', [], ''), true);
});

test('with a list, only listed addresses get in', () => {
  const list = ['a@example.test', 'b@example.test'];
  assert.equal(isEmailAllowed('a@example.test', list, ''), true);
  assert.equal(isEmailAllowed('stranger@example.test', list, ''), false);
});

test('the admin address is always allowed', () => {
  assert.equal(isEmailAllowed('founder@example.test', ['a@example.test'], 'founder@example.test'), true);
});

test('an unset admin address does not let an empty email through', () => {
  assert.equal(isEmailAllowed('', ['a@example.test'], ''), false);
});
