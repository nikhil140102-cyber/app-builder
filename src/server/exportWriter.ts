import { promises as fs } from 'fs';
import path from 'path';
import type { GeneratedFile } from '@/core/types';

/**
 * Writes an export straight into a folder on this computer so it can be
 * opened in Android Studio / VS Code without unzipping.
 *
 * - Files marked keepIfExists (pubspec.yaml, package.json…) are not overwritten.
 * - Files written by the previous save but no longer generated (e.g. a renamed
 *   page) are removed. Files the user created themselves are never touched.
 */
const MANIFEST = '.appbuilder-files.json';
const SAFE_FOLDER = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const SAFE_FILE = /^[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*$/;

export function exportRoot() {
  return path.resolve(process.env.EXPORT_DIR || path.join(process.cwd(), 'exports'));
}

export class ExportPathError extends Error {}

export async function writeExport(target: 'flutter' | 'react-native', folder: string, files: GeneratedFile[]) {
  if (!SAFE_FOLDER.test(folder)) throw new ExportPathError('Invalid folder name');
  const dir = path.join(exportRoot(), target, folder);
  for (const f of files) {
    if (!SAFE_FILE.test(f.path) || f.path.split('/').some((seg) => seg === '..' || seg === '.')) {
      throw new ExportPathError(`Invalid file path: ${f.path}`);
    }
  }
  await fs.mkdir(dir, { recursive: true });

  let previous: string[] = [];
  try {
    previous = JSON.parse(await fs.readFile(path.join(dir, MANIFEST), 'utf8'));
  } catch {}

  const written: string[] = [];
  const kept: string[] = [];
  for (const f of files) {
    const abs = path.join(dir, ...f.path.split('/'));
    if (f.keepIfExists) {
      const exists = await fs.stat(abs).then(() => true, () => false);
      if (exists) {
        kept.push(f.path);
        continue;
      }
    }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, f.content, 'utf8');
    if (f.executable && process.platform !== 'win32') await fs.chmod(abs, 0o755);
    written.push(f.path);
  }

  // Only fully generated files are tracked; files users may customise are never removed.
  const current = new Set(files.filter((f) => !f.keepIfExists).map((f) => f.path));
  const allNow = new Set(files.map((f) => f.path));
  const removed: string[] = [];
  for (const old of previous) {
    if (typeof old !== 'string' || allNow.has(old) || !SAFE_FILE.test(old)) continue;
    await fs.rm(path.join(dir, ...old.split('/')), { force: true });
    removed.push(old);
  }
  await fs.writeFile(path.join(dir, MANIFEST), JSON.stringify([...current].sort(), null, 2), 'utf8');

  return { dir, written, kept, removed };
}
