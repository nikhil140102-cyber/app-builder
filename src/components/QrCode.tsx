'use client';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/** QR code image for a link. Dark modules on white so phone cameras read it in any theme. */
export function QrCode({ value, size = 180, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#FFFFFF' } }).then(
      (url) => alive && setSrc(url),
      () => alive && setSrc(''),
    );
    return () => {
      alive = false;
    };
  }, [value, size]);
  if (!src) return <div className="qr" style={{ width: size, height: size }} aria-label={label} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="qr" src={src} width={size} height={size} alt={label} />;
}
