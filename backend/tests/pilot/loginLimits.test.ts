import test from 'node:test';
import assert from 'node:assert/strict';
import { isLockedOut, MAX_LOGIN_ATTEMPTS } from '../../src/modules/pilot/loginLimits.js';

test('the attempt that reaches the limit is still judged; the next one is locked out', () => {
  assert.equal(isLockedOut(1), false);
  assert.equal(isLockedOut(MAX_LOGIN_ATTEMPTS), false);
  assert.equal(isLockedOut(MAX_LOGIN_ATTEMPTS + 1), true);
});
