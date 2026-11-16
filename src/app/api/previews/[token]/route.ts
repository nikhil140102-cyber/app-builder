import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { InvalidProjectError, migrate } from '@/core/schema';

export const dynamic = 'force-dynamic';

/** Live preview storage for the files mode (no Supabase). */
const DIR = path.join(process.cwd(), 'data', 'previews');
const SAFE = /^[A-Za-z0-9_-]{12,64}$/;
type Ctx = { params: Promise<{ token: string }> };
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  if (!SAFE.test(token)) return bad('Invalid link');
  try {
    return NextResponse.json(JSON.parse(await fs.readFile(path.join(DIR, `${token}.json`), 'utf8')));
  } catch {
    return bad('This preview link does not exist or was turned off.', 404);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const { token } = await params;
  if (!SAFE.test(token)) return bad('Invalid link');
  try {
    const doc = migrate(await req.json());
    await fs.mkdir(DIR, { recursive: true });
    const file = path.join(DIR, `${token}.json`);
    await fs.writeFile(`${file}.tmp`, JSON.stringify(doc), 'utf8');
    await fs.rename(`${file}.tmp`, file);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad((e as Error).message, e instanceof InvalidProjectError || e instanceof SyntaxError ? 400 : 500);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { token } = await params;
  if (!SAFE.test(token)) return bad('Invalid link');
  await fs.rm(path.join(DIR, `${token}.json`), { force: true });
  return NextResponse.json({ ok: true });
}
