'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { C } from './ui';

// Renders a QR for `value` as an inline SVG, with download buttons.
export function QR({ value, size = 160, label }) {
  const [svg, setSvg] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!value) { setSvg(''); return; }
    QRCode.toString(value, {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#0A0A0B', light: '#ffffff' },
    }).then(setSvg).catch(() => setSvg(''));
  }, [value]);

  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${label || 'code'}.svg`;
    a.click();
  }
  async function downloadPng() {
    const url = await QRCode.toDataURL(value, { margin: 1, scale: 12, color: { dark: '#0A0A0B', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${label || 'code'}.png`;
    a.click();
  }

  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div ref={ref}
        style={{ width: size, height: size, background: '#fff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        dangerouslySetInnerHTML={{ __html: svg }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={downloadPng} style={qrBtn}>PNG</button>
        <button onClick={downloadSvg} style={qrBtn}>SVG</button>
      </div>
    </div>
  );
}
const qrBtn = {
  cursor: 'pointer', fontWeight: 600, fontSize: 11.5, padding: '6px 12px', borderRadius: 8,
  background: C.ink3, border: `1px solid ${C.line2}`, color: C.white,
};
