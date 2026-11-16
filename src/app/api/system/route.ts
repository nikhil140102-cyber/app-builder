import os from 'os';
import { NextResponse } from 'next/server';
import { exportRoot } from '@/server/exportWriter';

export const dynamic = 'force-dynamic';

/** Facts about where the builder is running, used for warnings and the Save to folder feature. */
/** Addresses other devices on the same Wi-Fi can use to reach this computer. */
function lanUrls(port: string): string[] {
  const out: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) out.push(`http://${a.address}:${port}`);
    }
  }
  // Home/office networks (192.168.x, 10.x) first.
  return out.sort((a, b) => Number(/\/\/(192\.168|10\.)/.test(b)) - Number(/\/\/(192\.168|10\.)/.test(a)));
}

export async function GET(req: Request) {
  const cwd = process.cwd();
  const port = (req.headers.get('host') ?? '').split(':')[1] ?? '3000';
  return NextResponse.json({
    cwd,
    exportDir: exportRoot(),
    oneDrive: /onedrive/i.test(cwd) || /onedrive/i.test(exportRoot()),
    // Hosted platforms like Vercel have no permanent disk, so saving to a folder is local-only.
    canSaveToFolder: process.env.NEXT_PUBLIC_STORAGE !== 'browser' && !process.env.VERCEL,
    lanUrls: process.env.VERCEL ? [] : lanUrls(port),
    platform: process.platform,
    node: process.versions.node,
  });
}
