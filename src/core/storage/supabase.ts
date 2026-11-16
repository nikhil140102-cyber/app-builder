import { migrate } from '../schema';
import { friendlyError, supabase } from '../supabase';
import type { AppDoc, ProjectSummary } from '../types';
import type { StorageAdapter } from './types';

/**
 * Saves projects in the Supabase "projects" table (see supabase/schema.sql).
 * Row level security limits every query to the signed-in user's rows.
 */
async function userId(): Promise<string> {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw new Error(friendlyError(error));
  const id = data.session?.user.id;
  if (!id) throw new Error('You are signed out. Sign in again to continue.');
  return id;
}

function fail(error: unknown): never {
  throw new Error(friendlyError(error));
}

export const supabaseStorage: StorageAdapter = {
  label: 'your account',

  async list(): Promise<ProjectSummary[]> {
    await userId();
    const { data, error } = await supabase()
      .from('projects')
      .select('id, name, page_count, updated_at')
      .order('updated_at', { ascending: false });
    if (error) fail(error);
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, pageCount: r.page_count, updatedAt: r.updated_at }));
  },

  async load(id) {
    await userId();
    const { data, error } = await supabase().from('projects').select('doc').eq('id', id).maybeSingle();
    if (error) fail(error);
    return data ? migrate(data.doc) : null;
  },

  async save(doc: AppDoc) {
    const owner = await userId();
    const { error } = await supabase()
      .from('projects')
      .upsert(
        {
          owner_id: owner,
          id: doc.id,
          name: doc.name,
          page_count: doc.pages.length,
          doc,
          created_at: doc.createdAt,
          updated_at: doc.updatedAt,
        },
        { onConflict: 'owner_id,id' },
      );
    if (error) fail(error);
  },

  async remove(id) {
    await userId();
    const { error } = await supabase().from('projects').delete().eq('id', id);
    if (error) fail(error);
  },
};
