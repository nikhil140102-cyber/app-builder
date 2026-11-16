'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Editor } from '@/components/editor/Editor';
import { storage } from '@/core/storage';
import { useEditor } from '@/core/store';
import '@/widgets';

export default function EditorRoute() {
  return (
    <AuthGate>
      <EditorPage />
    </AuthGate>
  );
}

function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    storage.load(id).then(
      (doc) => {
        if (!alive) return;
        if (!doc) return setStatus('missing');
        useEditor.getState().load(doc);
        setStatus('ready');
      },
      (e: Error) => {
        if (!alive) return;
        setMessage(e.message);
        setStatus('error');
      },
    );
    return () => {
      alive = false;
    };
  }, [id]);

  if (status === 'ready') return <Editor />;
  return (
    <div className="dash">
      {status === 'loading' && <p className="note">Opening project…</p>}
      {status === 'missing' && <p>This project doesn’t exist any more.</p>}
      {status === 'error' && <p className="error">Could not open the project: {message}</p>}
      {status !== 'loading' && (
        <p>
          <Link className="btn" href="/">Back to projects</Link>
        </p>
      )}
    </div>
  );
}
