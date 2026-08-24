/**
 * Extracts a message from a caught value without assuming it's an Error.
 * `catch` clauses type their binding as `unknown` under strict TS settings --
 * this is the narrowing every catch block that reads `.message` needs.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Extracts a `.code` property (e.g. Postgres error codes like '42P07') from
 * a caught value of unknown shape. Returns undefined if there isn't one.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
