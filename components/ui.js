'use client';
import { useState, useEffect } from 'react';

export const C = {
  red: 'var(--rental-red)', catYellow: 'var(--cat-yellow)',
  ink: 'var(--ink)', ink2: 'var(--ink-2)', ink3: 'var(--ink-3)', ink4: 'var(--ink-4)',
  line: 'var(--line)', line2: 'var(--line-2)',
  white: 'var(--text)', fog: 'var(--fog)', fog2: 'var(--fog-2)', good: '#34C759', warn: '#FFB020',
};

export const BRANDS = {
  corporate: {
    accent: '#FFCD11', accentText: '#0A0A0B', accentSoft: 'rgba(255,205,17,.14)',
    logo: 'https://www.clevelandbrothers.com/hubfs/branding/cb-logo-header.svg',
    logoFallback: 'CLEVELAND BROTHERS', name: 'Cleveland Brothers',
    glowA: 'rgba(255,205,17,.13)', glowB: 'rgba(255,205,17,.06)',
  },
  cat: {
    accent: '#FFCD11', accentText: '#0A0A0B', accentSoft: 'rgba(255,205,17,.14)',
    logo: 'https://www.clevelandbrothers.com/hubfs/branding/cb-logo-header.svg',
    logoFallback: 'CLEVELAND BROTHERS', name: 'Cleveland Brothers',
    glowA: 'rgba(255,205,17,.13)', glowB: 'rgba(255,205,17,.06)',
  },
};

export const ACCENT = 'var(--accent)', ACCENT_TEXT = 'var(--accent-text)', ACCENT_SOFT = 'var(--accent-soft)';

export const card = { background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14 };
export const inputStyle = {
  width: '100%', fontSize: 13.5, padding: '10px 12px', borderRadius: 10,
  background: C.ink3, border: `1px solid ${C.line2}`, color: C.white, outline: 'none',
};
export const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: C.fog, marginBottom: 7 };

export function BrandLogo({ brand, height = 30 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [brand.logo]);
  if (failed)
    return <span style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: height * 0.46, color: 'var(--text)', whiteSpace: 'nowrap' }}>{brand.logoFallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={brand.logo} alt={brand.name} onError={() => setFailed(true)} style={{ height, width: 'auto', maxWidth: 190, objectFit: 'contain', display: 'block' }} />;
}

export function Btn({ children, onClick, variant = 'primary', disabled, style, type, title }) {
  const base = {
    cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13.5, borderRadius: 10,
    padding: '10px 16px', border: '1px solid transparent', transition: 'filter .15s, border-color .15s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : 1, ...style,
  };
  const variants = {
    primary: { background: ACCENT, color: ACCENT_TEXT },
    ghost: { background: 'transparent', border: `1px solid ${C.line2}`, color: C.white },
    subtle: { background: C.ink3, border: `1px solid ${C.line2}`, color: C.white },
    good: { background: 'rgba(52,199,89,.15)', border: '1px solid rgba(52,199,89,.4)', color: '#7ee29a' },
    danger: { background: 'transparent', border: '1px solid #5a4a1f', color: '#FFB020' },
  };
  return (
    <button type={type || 'button'} title={title} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = 'brightness(1.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}>
      {children}
    </button>
  );
}

const STATUS_COLORS = {
  active: [C.good, 'rgba(52,199,89,.14)'],
  paused: [C.warn, 'rgba(255,176,32,.16)'],
  pending: [C.warn, 'rgba(255,176,32,.14)'],
  deprecated: ['#c9a227', 'rgba(255,205,17,.12)'],
  retired: [C.fog2, 'rgba(110,110,120,.18)'],
  rejected: ['#D99A5B', 'rgba(255,176,32,.12)'],
  archived: [C.fog2, 'rgba(110,110,120,.14)'],
  changes_requested: [C.warn, 'rgba(255,176,32,.14)'],
  approved: [C.good, 'rgba(52,199,89,.14)'],
};
export function StatusBadge({ status }) {
  const [color, bg] = STATUS_COLORS[status] || [ACCENT, ACCENT_SOFT];
  return (
    <span className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', padding: '3px 8px', borderRadius: 6, background: bg, color, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {String(status).replace('_', ' ')}
    </span>
  );
}

export function Badge({ children, color = ACCENT, bg = ACCENT_SOFT }) {
  return <span className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', padding: '3px 8px', borderRadius: 6, background: bg, color, fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>;
}

export function Field({ label, param, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span>{label}</span>
        {param && <span className="mono" style={{ fontSize: 10.5, color: C.fog2, fontWeight: 500 }}>{param}</span>}
      </label>
      {children}
      {hint && <div style={{ marginTop: 6, fontSize: 11.5, color: C.fog2 }}>{hint}</div>}
    </div>
  );
}

export function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 26, letterSpacing: '-.025em', lineHeight: 1.05 }}>{title}</h1>
        {sub && <p style={{ color: C.fog, fontSize: 13.5, marginTop: 6 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Search({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.fog2, fontSize: 14 }}>⌕</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 32 }} />
    </div>
  );
}

export function Modal({ title, sub, onClose, children, width = 540 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width, maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${C.line}` }}>
          <div>
            <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 17 }}>{title}</h3>
            {sub && <p style={{ color: C.fog, fontSize: 12.5, marginTop: 4 }}>{sub}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fog, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
