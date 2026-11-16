'use client';
import { useEffect, useState } from 'react';
import { QrCode } from '@/components/QrCode';
import { newShareToken, previewsAvailable, previewUrl, publishPreview, removePreview } from '@/core/previews';
import { useEditor } from '@/core/store';
import { useSystemInfo } from '@/utils/system';

/** Live preview link + QR code, for trying the app on a phone or sending to a client. */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const doc = useEditor((s) => s.doc);
  const sys = useSystemInfo();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [lanIndex, setLanIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!doc) return null;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  const lan = sys?.lanUrls ?? [];
  const origin = local && lan.length ? lan[Math.min(lanIndex, lan.length - 1)] : window.location.origin;
  const url = doc.share.enabled && doc.share.token ? previewUrl(origin, doc.share.token) : '';

  async function turnOn() {
    setBusy(true);
    setError('');
    const token = doc!.share.token || newShareToken();
    useEditor.getState().update((d) => {
      d.share = { enabled: true, token };
    });
    try {
      await publishPreview(useEditor.getState().doc!);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function turnOff() {
    setBusy(true);
    const token = doc!.share.token;
    useEditor.getState().update((d) => {
      d.share = { enabled: false, token: d.share.token };
    });
    await removePreview(token).catch(() => undefined);
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copy was blocked. Select the link and copy it by hand.');
    }
  }

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Preview on a phone" style={{ height: 'auto', width: 'min(640px, 100%)' }}>
        <header>
          <h2>Preview on a phone</h2>
          <div className="grow" />
          <button className="btn" onClick={onClose}>Close</button>
        </header>
        <div className="steps">
          {!previewsAvailable ? (
            <p>Live preview needs the builder to save on a server or in accounts. It is not available when apps are saved only in this browser.</p>
          ) : !doc.share.enabled ? (
            <>
              <p style={{ marginTop: 0 }}>
                Turn on a private link that opens this app on any phone, already in Preview mode. It updates by itself a few seconds after you save, so you can design on the computer and test on the phone.
              </p>
              <p className="note">Anyone with the link can view the app (not edit it). You can turn it off at any time.</p>
              <button className="btn primary" onClick={turnOn} disabled={busy}>{busy ? 'Turning on…' : 'Turn on live preview'}</button>
            </>
          ) : (
            <div className="sharegrid">
              <QrCode value={url} size={170} label={`QR code for ${url}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                <b>Scan with your phone’s camera</b>
                <div className="cmd" style={{ margin: 0 }}>
                  <code>{url}</code>
                  <button className="btn small" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
                </div>
                {local && (
                  <p className="note" style={{ margin: 0 }}>
                    {lan.length
                      ? 'Your phone must be on the same Wi-Fi as this computer. If it does not open, allow Node.js through Windows Firewall (Private networks) and try again.'
                      : 'No Wi-Fi address found for this computer. Connect it to Wi-Fi, or put the builder online, to preview on a phone.'}
                  </p>
                )}
                {local && lan.length > 1 && (
                  <label className="field">
                    <span>Network address</span>
                    <select id="lan" value={lanIndex} onChange={(e) => setLanIndex(Number(e.target.value))}>
                      {lan.map((u, i) => (
                        <option key={u} value={i}>{u}</option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="actions">
                  <button className="btn" onClick={turnOn} disabled={busy}>Update now</button>
                  <button className="btn danger" onClick={turnOff} disabled={busy}>Turn off link</button>
                </div>
              </div>
            </div>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
