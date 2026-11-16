import { NextResponse } from 'next/server';
import { SAFE_ID } from '@/core/ids';
import { InvalidProjectError, migrate } from '@/core/schema';
import { deleteProject, readProject, writeProject } from '@/server/projectsRepo';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!SAFE_ID.test(id)) return bad('Invalid project id');
  const doc = await readProject(id);
  return doc ? NextResponse.json(doc) : bad('Project not found', 404);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!SAFE_ID.test(id)) return bad('Invalid project id');
  try {
    const doc = migrate(await req.json());
    if (doc.id !== id) return bad('Project id does not match the URL');
    await writeProject(doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof InvalidProjectError || e instanceof SyntaxError) return bad(e.message);
    return bad((e as Error).message, 500);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!SAFE_ID.test(id)) return bad('Invalid project id');
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
