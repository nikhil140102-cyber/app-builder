'use client';
import { browserStorage } from './storage/browser';
import { serverStorage } from './storage/server';
import { storage } from './storage';
import type { ProjectSummary } from './types';

/**
 * Apps saved before accounts were switched on live in data/projects (files)
 * or in this browser. These helpers find them and copy them into the account.
 * The local copies are left in place, so nothing is ever lost.
 */
export interface LocalApp extends ProjectSummary {
  source: 'files' | 'browser';
}

async function safeList(fn: () => Promise<ProjectSummary[]>): Promise<ProjectSummary[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function findLocalApps(): Promise<LocalApp[]> {
  const [files, browser, account] = await Promise.all([
    safeList(() => serverStorage.list()),
    safeList(() => browserStorage.list()),
    safeList(() => storage.list()),
  ]);
  const inAccount = new Set(account.map((p) => p.id));
  const seen = new Set<string>();
  const out: LocalApp[] = [];
  for (const [list, source] of [[files, 'files'], [browser, 'browser']] as const) {
    for (const p of list) {
      if (inAccount.has(p.id) || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({ ...p, source });
    }
  }
  return out;
}

export async function copyToAccount(apps: LocalApp[], onProgress?: (done: number) => void): Promise<{ copied: number; failed: string[] }> {
  let copied = 0;
  const failed: string[] = [];
  for (const app of apps) {
    try {
      const doc = await (app.source === 'files' ? serverStorage : browserStorage).load(app.id);
      if (!doc) throw new Error('not found');
      await storage.save(doc);
      copied++;
    } catch {
      failed.push(app.name);
    }
    onProgress?.(copied + failed.length);
  }
  return { copied, failed };
}
