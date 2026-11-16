'use client';
import type { GeneratedFile } from './types';

/**
 * Talks to GitHub straight from the browser. The person's token is kept only
 * in this browser (localStorage) and sent only to api.github.com — the
 * builder's server never sees it.
 *
 * Token: GitHub → Settings → Developer settings → Personal access tokens →
 * Tokens (classic) → scopes "repo" and "workflow".
 */
const TOKEN_KEY = 'app-builder:github-token';
const API = 'https://api.github.com';

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class GitHubError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

async function gh<T = unknown>(path: string, init: RequestInit = {}, token = getToken()): Promise<T> {
  if (!token) throw new GitHubError('Connect GitHub first.');
  let res: Response;
  try {
    res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new GitHubError('Cannot reach GitHub. Check your internet connection.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? `GitHub answered ${res.status}`;
    if (res.status === 401) throw new GitHubError('GitHub rejected the token. Create a new one (scopes: repo, workflow) and connect again.', 401);
    if (res.status === 403 && /workflow/i.test(msg)) throw new GitHubError('The token needs the "workflow" scope to add the build file. Create a new token with "repo" and "workflow".', 403);
    if (res.status === 403 && /rate limit/i.test(msg)) throw new GitHubError('GitHub rate limit reached. Wait a few minutes and try again.', 403);
    throw new GitHubError(msg, res.status);
  }
  return data as T;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

/** Checks a token and returns who it belongs to, plus a warning if scopes are missing. */
export async function verifyToken(token: string): Promise<{ user: GitHubUser; warning: string }> {
  let res: Response;
  try {
    res = await fetch(`${API}/user`, { headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/vnd.github+json' } });
  } catch {
    throw new GitHubError('Cannot reach GitHub. Check your internet connection.');
  }
  if (res.status === 401) throw new GitHubError('That token is not valid. Copy it again from GitHub.');
  if (!res.ok) throw new GitHubError(`GitHub answered ${res.status}.`);
  const scopes = (res.headers.get('x-oauth-scopes') ?? '').split(',').map((x) => x.trim());
  const missing = ['repo', 'workflow'].filter((s) => !scopes.includes(s));
  const fineGrained = !res.headers.get('x-oauth-scopes');
  const warning = fineGrained
    ? 'This looks like a fine-grained token. If pushing fails, create a classic token with the "repo" and "workflow" scopes.'
    : missing.length
      ? `The token is missing: ${missing.join(', ')}. Cloud builds need both "repo" and "workflow".`
      : '';
  return { user: (await res.json()) as GitHubUser, warning };
}

export async function currentUser(): Promise<GitHubUser> {
  return gh<GitHubUser>('/user');
}

interface Repo {
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  owner: { login: string };
  name: string;
}

/** Gets the repo, creating it (with a first commit) if it does not exist. */
export async function ensureRepo(fullName: string, isPrivate: boolean, description: string): Promise<Repo> {
  try {
    return await gh<Repo>(`/repos/${fullName}`);
  } catch (e) {
    if ((e as GitHubError).status !== 404) throw e;
  }
  const [owner, name] = fullName.split('/');
  const me = await currentUser();
  const body = JSON.stringify({ name, private: isPrivate, auto_init: true, description });
  const path = owner.toLowerCase() === me.login.toLowerCase() ? '/user/repos' : `/orgs/${owner}/repos`;
  const repo = await gh<Repo>(path, { method: 'POST', body });
  // A brand-new repo can take a moment before its first commit is readable.
  for (let i = 0; i < 10; i++) {
    try {
      await gh(`/repos/${repo.full_name}/git/ref/heads/${repo.default_branch}`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  return repo;
}

const MANIFEST = '.appbuilder-files.json';

/**
 * Commits the generated files in one commit.
 * - keepIfExists files (pubspec.yaml…) are only added when missing, so edits made on GitHub survive.
 * - Files written by an earlier push but no longer generated (renamed pages) are deleted.
 * - Files people added themselves are never touched.
 */
export async function pushFiles(repo: Repo, files: GeneratedFile[], message: string): Promise<{ commitUrl: string; sha: string; changed: number }> {
  const branch = repo.default_branch;
  const ref = await gh<{ object: { sha: string } }>(`/repos/${repo.full_name}/git/ref/heads/${branch}`);
  const head = await gh<{ tree: { sha: string } }>(`/repos/${repo.full_name}/git/commits/${ref.object.sha}`);
  const tree = await gh<{ tree: { path: string; type: string }[]; truncated: boolean }>(
    `/repos/${repo.full_name}/git/trees/${head.tree.sha}?recursive=1`,
  );
  const existing = new Set(tree.tree.filter((t) => t.type === 'blob').map((t) => t.path));

  let previous: string[] = [];
  if (existing.has(MANIFEST)) {
    try {
      const m = await gh<{ content: string }>(`/repos/${repo.full_name}/contents/${MANIFEST}?ref=${branch}`);
      previous = JSON.parse(decodeURIComponent(escape(atob(m.content.replace(/\n/g, '')))));
    } catch {}
  }

  const entries: { path: string; mode: string; type: 'blob'; content?: string; sha?: null }[] = [];
  const generated = files.filter((f) => !f.keepIfExists).map((f) => f.path);
  for (const f of files) {
    if (f.keepIfExists && existing.has(f.path)) continue;
    entries.push({ path: f.path, mode: f.executable ? '100755' : '100644', type: 'blob', content: f.content });
  }
  const now = new Set(files.map((f) => f.path));
  for (const old of previous) {
    if (typeof old === 'string' && !now.has(old) && existing.has(old)) entries.push({ path: old, mode: '100644', type: 'blob', sha: null });
  }
  entries.push({ path: MANIFEST, mode: '100644', type: 'blob', content: JSON.stringify(generated.sort(), null, 2) + '\n' });

  const newTree = await gh<{ sha: string }>(`/repos/${repo.full_name}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: head.tree.sha, tree: entries }),
  });
  if (newTree.sha === head.tree.sha) return { commitUrl: `${repo.html_url}/commits/${branch}`, sha: ref.object.sha, changed: 0 };
  const commit = await gh<{ sha: string; html_url: string }>(`/repos/${repo.full_name}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }),
  });
  await gh(`/repos/${repo.full_name}/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  return { commitUrl: commit.html_url, sha: commit.sha, changed: entries.length };
}

/** Turns on GitHub Pages (built by Actions). Returns the site URL, or a reason it is unavailable. */
export async function enablePages(repo: Repo): Promise<{ url: string; note: string }> {
  try {
    const p = await gh<{ html_url: string }>(`/repos/${repo.full_name}/pages`);
    return { url: p.html_url, note: '' };
  } catch (e) {
    if ((e as GitHubError).status !== 404) return { url: '', note: (e as Error).message };
  }
  try {
    const p = await gh<{ html_url: string }>(`/repos/${repo.full_name}/pages`, { method: 'POST', body: JSON.stringify({ build_type: 'workflow' }) });
    return { url: p.html_url, note: '' };
  } catch (e) {
    const msg = (e as Error).message;
    if (repo.private && /plan|upgrade|not available|private/i.test(msg)) {
      return { url: '', note: 'Web publishing on GitHub Pages needs a public repository (or a paid GitHub plan for private ones). The Android build still works.' };
    }
    return { url: '', note: `Could not turn on web publishing: ${msg}` };
  }
}

export interface BuildRun {
  id: number;
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | null | string;
  html_url: string;
  created_at: string;
  head_sha: string;
}

/** Starts the build again without new code (e.g. after nothing changed). */
export async function rerunBuild(fullName: string): Promise<void> {
  await gh(`/repos/${fullName}/actions/workflows/build.yml/dispatches`, { method: 'POST', body: JSON.stringify({ ref: (await gh<Repo>(`/repos/${fullName}`)).default_branch }) });
}

export async function getRepo(fullName: string): Promise<Repo> {
  return gh<Repo>(`/repos/${fullName}`);
}

export async function latestRun(fullName: string): Promise<BuildRun | null> {
  const r = await gh<{ workflow_runs: BuildRun[] }>(`/repos/${fullName}/actions/runs?per_page=1`);
  return r.workflow_runs[0] ?? null;
}

export async function latestRelease(fullName: string): Promise<{ html_url: string; apk?: string; tag: string } | null> {
  try {
    const r = await gh<{ html_url: string; tag_name: string; assets: { name: string; browser_download_url: string }[] }>(
      `/repos/${fullName}/releases/latest`,
    );
    return { html_url: r.html_url, tag: r.tag_name, apk: r.assets.find((a) => a.name.endsWith('.apk'))?.browser_download_url };
  } catch (e) {
    if ((e as GitHubError).status === 404) return null;
    throw e;
  }
}
