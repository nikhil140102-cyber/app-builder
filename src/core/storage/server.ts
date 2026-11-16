import { migrate } from '../schema';
import type { AppDoc } from '../types';
import type { StorageAdapter } from './types';

async function check(res: Response) {
  if (!res.ok) {
    let msg = `Server returned ${res.status}`;
    try {
      msg = (await res.json()).error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res;
}

/** Saves projects through the app's own API (/api/projects). */
export const serverStorage: StorageAdapter = {
  label: 'the project folder',
  async list() {
    const res = await check(await fetch('/api/projects', { cache: 'no-store' }));
    return res.json();
  },
  async load(id) {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    await check(res);
    return migrate(await res.json());
  },
  async save(doc: AppDoc) {
    await check(
      await fetch(`/api/projects/${encodeURIComponent(doc.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc),
      }),
    );
  },
  async remove(id) {
    await check(await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  },
};
