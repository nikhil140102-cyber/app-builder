import { NextResponse } from 'next/server';
import type { GeneratedFile } from '@/core/types';
import { ExportPathError, writeExport } from '@/server/exportWriter';

export const dynamic = 'force-dynamic';

/** Saves generated files into the exports folder on this computer. */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_STORAGE === 'browser' || process.env.VERCEL) {
    return NextResponse.json({ error: 'Saving to a folder is only available when the builder runs on your own computer.' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { target?: string; folder?: string; files?: GeneratedFile[] };
    const target = body.target === 'react-native' ? 'react-native' : body.target === 'flutter' ? 'flutter' : null;
    if (!target || typeof body.folder !== 'string' || !Array.isArray(body.files) || body.files.length > 500) {
      return NextResponse.json({ error: 'Invalid export request' }, { status: 400 });
    }
    const files = body.files.filter((f) => typeof f?.path === 'string' && typeof f?.content === 'string');
    return NextResponse.json(await writeExport(target, body.folder, files));
  } catch (e) {
    const status = e instanceof ExportPathError || e instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
