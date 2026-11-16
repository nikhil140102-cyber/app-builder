'use client';
import { useEffect, useState } from 'react';

export interface SystemInfo {
  cwd: string;
  exportDir: string;
  oneDrive: boolean;
  canSaveToFolder: boolean;
  lanUrls: string[];
  platform: string;
  node: string;
}

let cache: Promise<SystemInfo | null> | null = null;

/** Info from the local server. Null when running as a static site (browser storage). */
export function useSystemInfo(): SystemInfo | null {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_STORAGE === 'browser') return;
    cache ??= fetch('/api/system', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    cache.then(setInfo);
  }, []);
  return info;
}
