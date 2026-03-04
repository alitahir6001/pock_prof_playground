declare module 'node:test' {
  const test: (name: string, fn: () => void | Promise<void>) => void;
  export default test;
}

declare module 'node:assert/strict' {
  const assert: {
    equal: (actual: unknown, expected: unknown) => void;
    deepEqual: (actual: unknown, expected: unknown) => void;
    ok: (value: unknown) => void;
    throws: (fn: () => unknown, expected?: RegExp) => void;
    rejects: (
      fn: () => Promise<unknown>,
      expected?: RegExp | Error | ((error: unknown) => boolean),
    ) => Promise<void>;
  };
  export default assert;
}
