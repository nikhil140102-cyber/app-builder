import { promises as fs } from 'fs';
import path from 'path';
import { SAFE_ID } from '@/core/ids';
import { migrate } from '@/core/schema';
import type { AppDoc, ProjectSummary } from '@/core/types';
import { summarize } from '@/core/storage/types';

/**
 * File-based project repository used by the API routes.
 * Replace this module with a database implementation to scale beyond one machine.
 */
const DIR = path.join(process.cwd(), 'data', 'projects');

function fileFor(id: string) {
  if (!SAFE_ID.test(id)) throw new Error('Invalid project id');
  return path.join(DIR, `${id}.json`);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  await fs.mkdir(DIR, { recursive: true });
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith('.json'));
  const out: ProjectSummary[] = [];
  for (const f of files) {
    try {
      out.push(summarize(migrate(JSON.parse(await fs.readFile(path.join(DIR, f), 'utf8')))));
    } catch {
      // Skip unreadable files rather than failing the whole list.
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function readProject(id: string): Promise<AppDoc | null> {
  try {
    return migrate(JSON.parse(await fs.readFile(fileFor(id), 'utf8')));
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

export async function writeProject(doc: AppDoc) {
  await fs.mkdir(DIR, { recursive: true });
  const target = fileFor(doc.id);
  const tmp = `${target}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(doc, null, 2), 'utf8');
  await fs.rename(tmp, target); // atomic replace, so a crash never leaves half a file
}

export async function deleteProject(id: string) {
  await fs.rm(fileFor(id), { force: true });
}
