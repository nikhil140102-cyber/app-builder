import type { AppDoc, ProjectSummary } from '../types';

/**
 * Every place projects can be saved implements this interface.
 * To move to a real database (Supabase, Postgres, Firebase…), write one
 * new adapter and select it in ./index.ts — the editor does not change.
 */
export interface StorageAdapter {
  readonly label: string;
  list(): Promise<ProjectSummary[]>;
  load(id: string): Promise<AppDoc | null>;
  save(doc: AppDoc): Promise<void>;
  remove(id: string): Promise<void>;
}

export function summarize(doc: AppDoc): ProjectSummary {
  return { id: doc.id, name: doc.name, pageCount: doc.pages.length, updatedAt: doc.updatedAt };
}
