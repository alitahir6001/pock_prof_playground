declare module 'node:test' {
  const test: (name: string, fn: () => void | Promise<void>) => void;
  export default test;
}

declare module 'node:assert/strict' {
  const assert: {
    equal: (actual: unknown, expected: unknown) => void;
    deepEqual: (actual: unknown, expected: unknown) => void;
    notEqual: (actual: unknown, expected: unknown) => void;
    ok: (value: unknown) => void;
    throws: (fn: () => unknown, expected?: RegExp) => void;
    rejects: (
      fn: () => Promise<unknown>,
      expected?: RegExp | Error | ((error: unknown) => boolean),
    ) => Promise<void>;
  };
  export default assert;
}

declare module 'node:fs/promises' {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function writeFile(path: string, data: string, encoding: 'utf8'): Promise<void>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
  export function mkdtemp(prefix: string): Promise<string>;
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
}

declare module 'node:crypto' {
  export function randomUUID(): string;
}

declare module 'node:os' {
  export function tmpdir(): string;
}
