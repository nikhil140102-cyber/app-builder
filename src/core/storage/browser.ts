import { brand } from '@/config/brand';
import { migrate } from '../schema';
import type { AppDoc, ProjectSummary } from '../types';
import { summarize, type StorageAdapter } from './types';

const indexKey = () => `${brand.storagePrefix}:index`;
const docKey = (id: string) => `${brand.storagePrefix}:project:${id}`;

function readIndex(): ProjectSummary[] {
  try {
    return JSON.parse(localStorage.getItem(indexKey()) || '[]');
  } catch {
    return [];
  }
}
function writeIndex(list: ProjectSummary[]) {
  localStorage.setItem(indexKey(), JSON.stringify(list));
}

/** Saves projects in this browser's localStorage. Works on any static host. */
export const browserStorage: StorageAdapter = {
  label: 'this browser',
  async list() {
    return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async load(id) {
    const raw = localStorage.getItem(docKey(id));
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  },
  async save(doc: AppDoc) {
    localStorage.setItem(docKey(doc.id), JSON.stringify(doc));
    writeIndex([summarize(doc), ...readIndex().filter((p) => p.id !== doc.id)]);
  },
  async remove(id) {
    localStorage.removeItem(docKey(id));
    writeIndex(readIndex().filter((p) => p.id !== id));
  },
};
