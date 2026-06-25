'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { C } from './ui';

// Renders a QR as an inline SVG, with download buttons.
// If `svgMarkup` is provided (e.g. Bitly's own QR image), it is rendered as-is
// instead of generating one locally from `value`.
export function QR({ value, size = 160, label, svgMarkup }) {
  const [svg, setSvg] = useState(svgMarkup || '');
  const ref = useRef(null);

  useEffect(() => {
    if (svgMarkup) { setSvg(svgMarkup); return; }   // Bitly-supplied QR
    if (!value) { setSvg(''); return; }
    QRCode.toString(value, {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#0A0A0B', light: '#ffffff' },
    }).then(setSvg).catch(() => setSvg(''));
  }, [value, svgMarkup]);

  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${label || 'code'}.svg`;
    a.click();
  }
  async function downloadPng() {
    // For a Bitly-supplied SVG, rasterize the SVG to PNG via canvas.
    if (svgMarkup && svg) {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
        const px = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = px; canvas.height = px;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, px, px);
        ctx.drawImage(img, 0, 0, px, px);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `qr-${label || 'code'}.png`;
        a.click();
      } finally { URL.revokeObjectURL(url); }
      return;
    }
    const url = await QRCode.toDataURL(value, { margin: 1, scale: 12, color: { dark: '#0A0A0B', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${label || 'code'}.png`;
    a.click();
  }

  if (!value && !svgMarkup) return null;
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
