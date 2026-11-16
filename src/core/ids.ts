export function newId(prefix = 'n'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${rand}`;
}

/** Ids are used as file names on the server, so keep them to a safe charset. */
export const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
