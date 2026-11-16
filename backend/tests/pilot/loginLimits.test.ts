import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLockedOut,
  mayRequestCode,
  MAX_CODES_PER_DAY,
  MAX_CODES_PER_WINDOW,
  MAX_LOGIN_ATTEMPTS,
} from '../../src/modules/pilot/loginLimits.js';

test('the attempt that reaches the limit is still judged; the next one is locked out', () => {
  assert.equal(isLockedOut(1), false);
  assert.equal(isLockedOut(MAX_LOGIN_ATTEMPTS), false);
  assert.equal(isLockedOut(MAX_LOGIN_ATTEMPTS + 1), true);
});

test('a code may be requested until the window limit is reached', () => {
  assert.equal(mayRequestCode(0, 0), true);
  assert.equal(mayRequestCode(MAX_CODES_PER_WINDOW - 1, MAX_CODES_PER_WINDOW - 1), true);
  assert.equal(mayRequestCode(MAX_CODES_PER_WINDOW, MAX_CODES_PER_WINDOW), false);
});

test('the daily limit holds even when the current window is quiet', () => {
  assert.equal(mayRequestCode(0, MAX_CODES_PER_DAY - 1), true);
  assert.equal(mayRequestCode(0, MAX_CODES_PER_DAY), false);
});
