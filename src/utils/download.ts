import JSZip from 'jszip';
import type { GeneratedFile } from '@/core/types';

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadJson(data: unknown, fileName: string) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), fileName);
}

export async function downloadZip(files: GeneratedFile[], folder: string, fileName: string) {
  const zip = new JSZip();
  const root = zip.folder(folder)!;
  files.forEach((f) => root.file(f.path, f.content, { unixPermissions: f.executable ? 0o755 : 0o644 }));
  // UNIX platform keeps the execute bit on .sh scripts; Windows ignores it.
  downloadBlob(await zip.generateAsync({ type: 'blob', platform: 'UNIX' }), fileName);
}
