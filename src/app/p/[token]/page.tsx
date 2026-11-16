'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@/components/editor/Canvas';
import { readPreview } from '@/core/previews';
import { useEditor } from '@/core/store';
import '@/widgets';

/** Public live preview: opens the app in Preview mode and refreshes when the designer saves. */
export default function LivePreview() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const stamp = useRef('');

  useEffect(() => {
    let alive = true;
    async function load(first: boolean) {
      try {
        const doc = await readPreview(token);
        if (!alive) return;
        if (!doc) return setState('missing');
        if (doc.updatedAt === stamp.current) return;
        stamp.current = doc.updatedAt;
        if (first) {
          useEditor.getState().load(doc);
          useEditor.getState().setMode('preview');
        } else {
          // Keep the page the viewer is on if it still exists.
          const { pageId } = useEditor.getState();
          useEditor.setState({ doc, pageId: doc.pages.some((p) => p.id === pageId) ? pageId : doc.pages[0].id });
        }
        setState('ready');
      } catch (e) {
        if (first && alive) {
          setMessage((e as Error).message);
          setState('error');
        }
      }
    }
    load(true);
    const t = setInterval(() => load(false), 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [token]);

  if (state === 'ready') {
    return (
      <div className="livepreview">
        <Canvas standalone />
      </div>
    );
  }
  return (
    <div className="auth">
      <div className="authcard">
        {state === 'loading' && <p className="note">Opening the app…</p>}
        {state === 'missing' && (
          <>
            <h1>Preview not available</h1>
            <p className="note">This preview link was turned off, or the address is incomplete. Ask the designer for a new link.</p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1>Could not open the preview</h1>
            <p className="error">{message}</p>
            <p className="note">If this phone is on Wi-Fi, check it is the same network as the computer running the builder.</p>
          </>
        )}
      </div>
    </div>
  );
}
