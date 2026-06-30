'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './api';
import {
  C, BRANDS, ACCENT, ACCENT_TEXT, ACCENT_SOFT, card, inputStyle, BrandLogo, Btn,
  StatusBadge, Badge, Field, PageHead, Search, Modal, fmtDate,
} from './ui';
import { QR } from './QR';

// ── Tool name: set this once you've chosen the final name. ──
// Appears on sign-in, the sidebar, and the browser tab.
const APP_NAME = 'Catalyst';

const RANK = { viewer: 0, user: 1, approver: 2, admin: 3 };
const can = (u, r) => u && (RANK[u.role] ?? -1) >= (RANK[r] ?? 99);

let toastFn = () => {};
function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => { toastFn = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2400); }; }, []);
  if (!msg) return null;
  const err = msg.startsWith('!');
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 200, background: C.white, color: C.ink, fontWeight: 600, fontSize: 13.5, padding: '11px 20px', borderRadius: 99, boxShadow: '0 12px 40px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: err ? C.warn : C.good }} />
      {err ? msg.slice(1) : msg}
    </div>
  );
}
const toast = (m) => toastFn(m);
const toastErr = (m) => toastFn('!' + m);

/* ----------------- SIGN IN ----------------- */
function SignIn({ onSignedIn }) {
  const brand = BRANDS.corporate;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e?.preventDefault?.();
    if (!email || !password) return toastErr('Enter your email and password');
    setBusy(true);
    try { const { user } = await api.signin(email.trim(), password); onSignedIn(user); }
    catch (err) { toastErr(err.message); setBusy(false); }
  }
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(800px 520px at 80% -10%, ${brand.glowA}, transparent 60%), radial-gradient(620px 460px at 6% 110%, ${brand.glowB}, transparent 55%)` }} />
      <div style={{ position: 'relative', width: 440, maxWidth: '92vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 26 }}>
          <BrandLogo brand={brand} height={32} />
          <div style={{ width: 1, height: 34, background: C.line2 }} />
          <div>
            <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 16, letterSpacing: '-.02em' }}>{APP_NAME}</div>
            <div style={{ fontSize: 12, color: C.fog }}>Internal marketing tool</div>
          </div>
        </div>
        <form onSubmit={submit} style={{ ...card, padding: 24 }}>
          <div style={{ fontSize: 13, color: C.fog, marginBottom: 18 }}>Sign in to continue.</div>
          <Field label="Email">
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clevelandbrothers.com" style={inputStyle} />
          </Field>
          <Field label="Password">
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" style={inputStyle} />
          </Field>
          <Btn type="submit" disabled={busy} style={{ width: '100%', marginTop: 4 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>
        <div style={{ marginTop: 14, fontSize: 11, color: C.fog2, textAlign: 'center', lineHeight: 1.6 }}>
          Accounts are created by an administrator. Contact your admin for access.
        </div>
      </div>
    </div>
  );
}

/* ----------------- DASHBOARD ----------------- */
function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const to = Number(target) || 0;
    if (to === 0) { setN(0); return; }
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function StatCard({ label, value, sub, icon, accent, onClick, delay = 0 }) {
  const n = useCountUp(value);
  return (
    <div onClick={onClick} className="cb-rise cb-hover" style={{ ...card, padding: '17px 19px', flex: 1, minWidth: 158, cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden', animationDelay: `${delay}ms` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent + '66'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,.45)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ position: 'absolute', top: -34, right: -24, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${accent}26, transparent 68%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <span style={{ fontSize: 12, color: C.fog, fontWeight: 600 }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}1f`, color: accent, fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 36, letterSpacing: '-.025em', lineHeight: 1, position: 'relative' }}>{n}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.fog2, marginTop: 8, position: 'relative' }}>{sub}</div>}
    </div>
  );
}

const STATUS_VIZ = [
  ['active', '#34C759'], ['paused', '#FFCD11'],
];
function Donut({ data, size = 132, stroke = 15 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - stroke) / 2, c = size / 2, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${c} ${c})`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.ink3} strokeWidth={stroke} />
        {data.filter((d) => d.value > 0).map((d, i) => {
          const len = (d.value / total) * circ, off = acc; acc += len;
          return <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-off} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray .9s cubic-bezier(.22,1,.36,1)' }} />;
        })}
      </g>
    </svg>
  );
}

function timeAgo(s) {
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function TrendChart({ points, height = 92 }) {
  const w = 100;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => [i * step, height - (p.value / max) * (height - 12) - 6]);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id="cbtrend" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFCD11" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFCD11" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cbtrend)" />
      <path d={line} fill="none" stroke="#FFCD11" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.7" fill="#FFCD11" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

function Dashboard({ user, go, data }) {
  const { codes, links, pending } = data;
  const weekly = useMemo(() => {
    const now = Date.now(), wk = 7 * 24 * 3600 * 1000, out = [];
    for (let i = 7; i >= 0; i--) {
      const start = now - (i + 1) * wk, end = now - i * wk;
      out.push({ value: links.filter((l) => { const t = new Date(l.created_at).getTime(); return t > start && t <= end; }).length });
    }
    return out;
  }, [links]);
  const weekTotal = weekly.reduce((s, b) => s + b.value, 0);
  const active = codes.filter((c) => c.status === 'active').length;
  const byBU = useMemo(() => {
    const m = {}; codes.forEach((c) => (m[c.business_unit] = (m[c.business_unit] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [codes]);
  const max = Math.max(1, ...byBU.map((b) => b[1]));
  const statusData = useMemo(() => {
    const m = {}; codes.forEach((c) => (m[c.status] = (m[c.status] || 0) + 1));
    return STATUS_VIZ.map(([k, color]) => ({ label: k, value: m[k] || 0, color })).filter((d) => d.value > 0);
  }, [codes]);
  const activity = useMemo(() => {
    const a = [
      ...codes.map((c) => ({ t: c.created_at, kind: 'code', label: c.camp_name, code: c.code, who: c.created_by })),
      ...links.map((l) => ({ t: l.created_at, kind: 'link', label: l.title, code: l.code, who: l.created_by })),
    ];
    return a.sort((x, y) => new Date(y.t) - new Date(x.t)).slice(0, 6);
  }, [codes, links]);
  const healthScore = Math.round((active / Math.max(1, codes.length)) * 100);

  return (
    <div>
      {/* hero */}
      <div className="cb-fade" style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, border: `1px solid ${C.line}`, background: `linear-gradient(120deg, ${C.ink2}, ${C.ink})`, padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(620px 240px at 88% -50%, rgba(255,205,17,.13), transparent 60%)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.fog2, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 9 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <h1 style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', lineHeight: 1.02 }}>Welcome back, {user.name.split(' ')[0]}</h1>
            <p style={{ color: C.fog, fontSize: 13.5, marginTop: 7 }}>Your campaign taxonomy, codes, and tracked links — all in one place.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(52,199,89,.1)', border: '1px solid rgba(52,199,89,.3)', borderRadius: 99, padding: '8px 14px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.good, boxShadow: '0 0 0 4px rgba(52,199,89,.18)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{healthScore}% active · taxonomy healthy</span>
            </div>
            {can(user, 'user') && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => go('links')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 9, background: ACCENT, color: ACCENT_TEXT, border: 'none' }}>⛓ Build a link</button>
                <button onClick={() => go('codes')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 9, background: 'transparent', color: C.white, border: `1px solid ${C.line2}` }}>⬢ Browse codes</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: 'flex', gap: 13, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatCard label="Campaign codes" value={codes.length} sub={`${active} active`} icon="⬢" accent="#FFCD11" onClick={() => go('codes')} delay={0} />
        <StatCard label="Pending approval" value={pending.length} sub="In the review queue" icon="✓" accent="#FFB020" onClick={() => go('approvals')} delay={70} />
        <StatCard label="UTM links built" value={links.length} sub="Logged to history" icon="⛓" accent="#8A8A93" onClick={() => go('links')} delay={140} />
        <StatCard label="Business units" value={new Set(codes.map((c) => c.bu)).size} sub="Across the taxonomy" icon="⊞" accent="#34C759" onClick={() => go('taxonomy')} delay={210} />
      </div>

      <div className="cb-rise cb-hover" style={{ ...card, padding: 20, marginBottom: 14, animationDelay: '90ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>Links built · last 8 weeks</h3>
          <span style={{ fontSize: 12.5, color: C.fog }}><b style={{ color: C.white, fontFamily: 'Archivo', fontSize: 16 }}>{weekTotal}</b> in this window</span>
        </div>
        <TrendChart points={weekly} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* bars */}
        <div className="cb-rise cb-hover" style={{ ...card, padding: 20, animationDelay: '120ms' }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Codes by business unit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {byBU.map(([name, n], i) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: C.fog }}>{name}</span><span className="mono" style={{ color: C.white, fontWeight: 600 }}>{n}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: C.ink3, overflow: 'hidden' }}>
                  <div className="cb-bar" style={{ height: '100%', width: `${(n / max) * 100}%`, borderRadius: 99, background: 'linear-gradient(90deg, #C99700, #FFCD11)', animationDelay: `${i * 90 + 200}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* donut */}
        <div className="cb-rise cb-hover" style={{ ...card, padding: 20, animationDelay: '180ms' }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Lifecycle status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Donut data={statusData} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{codes.length}</div>
                <div style={{ fontSize: 10, color: C.fog2 }}>codes</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusData.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ color: C.fog, textTransform: 'capitalize', flex: 1 }}>{d.label}</span>
                  <span className="mono" style={{ color: C.white, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* activity + review */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="cb-rise cb-hover" style={{ ...card, padding: 20, animationDelay: '240ms' }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent activity</h3>
          {activity.length === 0
            ? <div style={{ padding: '24px 0', textAlign: 'center', color: C.fog2, fontSize: 13 }}>No activity yet.</div>
            : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < activity.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: a.kind === 'link' ? 'rgba(255,255,255,.1)' : 'rgba(255,205,17,.14)', color: a.kind === 'link' ? C.white : '#FFCD11' }}>{a.kind === 'link' ? '⛓' : '⬢'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.kind === 'link' ? 'Link built' : 'Code'} · {a.label}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: C.fog2 }}>{a.code} · {a.who}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.fog2, flexShrink: 0 }}>{timeAgo(a.t)}</span>
                </div>
              ))}
            </div>}
        </div>
        <div className="cb-rise cb-hover" style={{ ...card, padding: 20, animationDelay: '300ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>Review queue</h3>
            <button onClick={() => go('approvals')} style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Open queue ›</button>
          </div>
          {pending.length === 0
            ? <div style={{ padding: '28px 0', textAlign: 'center', color: C.fog2, fontSize: 13 }}>Nothing pending. The taxonomy is clean.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.slice(0, 5).map((r) => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 9, alignItems: 'center' }}>
                  <Badge>{r.proposed.code}</Badge>
                  <span style={{ fontSize: 12.5, color: C.white }}>{r.proposed.campName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: C.fog2 }}>by {r.requested_by}</span>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
}

/* ----------------- CAMPAIGN CODES + LIFECYCLE ----------------- */
const LIFECYCLE = {
  active: ['paused'],
  paused: ['active'],
};
function CampaignCodes({ user, data, reload }) {
  const [q, setQ] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReq, setShowReq] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const isApprover = can(user, 'approver');

  const filtered = useMemo(() => data.codes.filter((c) => {
    if (buFilter && c.bu !== buFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (!q) return true;
    return `${c.code} ${c.camp_name} ${c.business_unit} ${c.initiative} ${c.department}`.toLowerCase().includes(q.toLowerCase());
  }), [data.codes, q, buFilter, statusFilter]);

  async function transition(id, to) {
    setMenuFor(null);
    try { await api.changeStatus(id, to); toast(to === 'paused' ? 'Code paused' : 'Code activated'); reload(); }
    catch (e) { toastErr(e.message); }
  }
  async function doRemove() {
    if (!confirmRemove) return;
    setRemoving(true);
    try { await api.deleteCode(confirmRemove.id); toast(`Removed ${confirmRemove.code}`); setConfirmRemove(null); reload(); }
    catch (e) { toastErr(e.message); } finally { setRemoving(false); }
  }
  function exportCsv() {
    const head = ['Code', 'Campaign', 'Department', 'Business Unit', 'Initiative', 'Status', 'Created By'];
    const rows = data.codes.map((c) => [c.code, c.camp_name, c.department, c.business_unit, c.initiative, c.status, c.created_by]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'campaign-codes.csv'; a.click(); toast(`Exported ${data.codes.length} codes`);
  }

  return (
    <div>
      <PageHead title="Campaign codes" sub={`${data.codes.length} codes in the registry`}
        right={<div style={{ display: 'flex', gap: 9 }}>
          <Btn variant="ghost" onClick={exportCsv}>Export CSV</Btn>
          <Btn onClick={() => setShowReq(true)}>+ Request new code</Btn>
        </div>} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Search value={q} onChange={setQ} placeholder="Search code, campaign, business unit…" />
        <select value={buFilter} onChange={(e) => setBuFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 170 }}>
          <option value="">All business units</option>
          {Object.entries(data.taxonomy.businessUnits).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 150 }}>
          <option value="">All statuses</option>
          {['active', 'paused'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ ...card, overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 130px 110px 40px', gap: 12, padding: '12px 18px', borderBottom: `1px solid ${C.line}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: C.fog2, fontWeight: 600 }}>
          <div>Code</div><div>Campaign</div><div>Business unit / Initiative</div><div>Department</div><div>Status</div><div></div>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>
          {filtered.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No codes match.</div>
            : filtered.map((c) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 130px 110px 40px', gap: 12, padding: '13px 18px', borderBottom: `1px solid ${C.line}`, alignItems: 'center', fontSize: 13, position: 'relative' }}>
                <div className="mono" style={{ fontWeight: 600, cursor: 'pointer' }} title="Click to copy"
                  onClick={() => { navigator.clipboard?.writeText(c.code); toast('Copied ' + c.code); }}>{c.code}</div>
                <div>{c.camp_name}</div>
                <div style={{ color: C.fog, fontSize: 12.5 }}>{c.business_unit}<span style={{ color: C.fog2 }}> · {c.initiative}</span></div>
                <div style={{ color: C.fog, fontSize: 12.5 }}>{c.department}</div>
                <div><StatusBadge status={c.status} /></div>
                <div>
                  {isApprover && (
                    <button onClick={() => setMenuFor(menuFor === c.id ? null : c.id)} style={{ background: 'none', border: 'none', color: C.fog, cursor: 'pointer', fontSize: 17, padding: 4 }}>⋯</button>
                  )}
                  {menuFor === c.id && (
                    <div style={{ position: 'absolute', right: 14, top: 42, zIndex: 20, ...card, padding: 6, minWidth: 160, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                      {(LIFECYCLE[c.status] || []).map((to) => (
                        <button key={to} onClick={() => transition(c.id, to)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: C.white, fontSize: 12.5, padding: '8px 8px', borderRadius: 7, cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.ink3)} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                          {to === 'paused' ? 'Pause' : to === 'active' ? 'Activate' : to}
                        </button>
                      ))}
                      <div style={{ height: 1, background: C.line, margin: '4px 6px' }} />
                      <button onClick={() => { setMenuFor(null); setConfirmRemove(c); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#FF6B6B', fontSize: 12.5, fontWeight: 600, padding: '8px 8px', borderRadius: 7, cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,107,107,.1)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {showReq && <RequestCodeModal user={user} taxonomy={data.taxonomy} existing={data.codes} onClose={() => setShowReq(false)} onDone={() => { setShowReq(false); reload(); }} />}
      {confirmRemove && (
        <Modal title="Remove campaign code" sub="This permanently deletes the code from the system." onClose={() => setConfirmRemove(null)} width={440}>
          <p style={{ fontSize: 13.5, color: C.fog, lineHeight: 1.6, marginBottom: 18 }}>
            Permanently remove <span className="mono" style={{ color: C.white }}>{confirmRemove.code}</span>
            {confirmRemove.camp_name ? <> — {confirmRemove.camp_name}</> : null}? This can’t be undone, and any links already built with this code will keep their UTM tag but the code won’t appear in the registry.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Btn variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doRemove} disabled={removing}>{removing ? 'Removing…' : 'Remove for good'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* Request-a-code modal (cascading builder -> creates an approval request) */
function RequestCodeModal({ user, taxonomy, existing, onClose, onDone }) {
  const [dept, setDept] = useState('');
  const [bu, setBu] = useState('');
  const [init, setInit] = useState('');
  const [campMode, setCampMode] = useState('existing');
  const [campPick, setCampPick] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const initOptions = bu ? taxonomy.initiatives[bu] || {} : {};
  const campOptions = init ? taxonomy.campaigns[init] || {} : {};
  const camp = campMode === 'existing' ? campPick : newCode.trim().toLowerCase();
  const campName = campMode === 'existing' ? campOptions[campPick] : newName.trim();
  const full = dept && bu && init && camp ? `${dept}-${bu}-${init}-${camp}` : '';
  const exists = existing.some((c) => c.code === full);
  const codeValid = /^[a-z]{2,4}$/.test(camp || '');
  const canSubmit = dept && bu && init && camp && campName && codeValid && !exists && !busy;

  async function submit() {
    setBusy(true);
    try {
      await api.createRequest({ dept, bu, init, camp, campName, note });
      toast(can(user, 'approver') ? 'Request created — approve it in the queue' : 'Request submitted for approval');
      onDone();
    } catch (e) { toastErr(e.message); setBusy(false); }
  }

  const sel = { ...inputStyle };
  return (
    <Modal title="Request a new campaign code" sub="Built from the taxonomy, then routed for approval." onClose={onClose} width={560}>
      <Field label="Department"><select value={dept} onChange={(e) => setDept(e.target.value)} style={sel}><option value="">Select…</option>{Object.entries(taxonomy.departments).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}</select></Field>
      <Field label="Business unit"><select value={bu} disabled={!dept} onChange={(e) => { setBu(e.target.value); setInit(''); setCampPick(''); }} style={{ ...sel, opacity: dept ? 1 : 0.5 }}><option value="">Select…</option>{Object.entries(taxonomy.businessUnits).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}</select></Field>
      <Field label="Initiative"><select value={init} disabled={!bu} onChange={(e) => { setInit(e.target.value); setCampPick(''); }} style={{ ...sel, opacity: bu ? 1 : 0.5 }}><option value="">Select…</option>{Object.entries(initOptions).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}</select></Field>
      <Field label="Campaign">
        <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
          <Btn variant={campMode === 'existing' ? 'primary' : 'subtle'} style={{ flex: 1, fontSize: 12.5, padding: 8 }} onClick={() => setCampMode('existing')}>Pick existing</Btn>
          <Btn variant={campMode === 'new' ? 'primary' : 'subtle'} style={{ flex: 1, fontSize: 12.5, padding: 8 }} onClick={() => setCampMode('new')}>Define new</Btn>
        </div>
        {campMode === 'existing'
          ? <select value={campPick} disabled={!init} onChange={(e) => setCampPick(e.target.value)} style={{ ...sel, opacity: init ? 1 : 0.5 }}><option value="">Select…</option>{Object.entries(campOptions).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}</select>
          : <div style={{ display: 'flex', gap: 8 }}>
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="code" maxLength={4} className="mono" style={{ ...inputStyle, width: 130 }} />
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Campaign name" style={inputStyle} />
          </div>}
      </Field>
      <Field label="Note for approver (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this code is needed" style={inputStyle} /></Field>
      <div style={{ marginTop: 4, marginBottom: 18, padding: '14px 16px', borderRadius: 10, background: C.ink3, border: `1px solid ${C.line2}` }}>
        <div style={{ fontSize: 11, color: C.fog2, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Generated code</div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: full ? ACCENT : C.fog2 }}>{full || '—'}</div>
        {exists && <div style={{ marginTop: 8, fontSize: 12, color: C.warn }}>This code already exists.</div>}
      </div>
      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!canSubmit} onClick={submit}>{can(user, 'approver') ? 'Submit request' : 'Submit for approval'}</Btn>
      </div>
    </Modal>
  );
}

/* ----------------- APPROVAL QUEUE ----------------- */
function Approvals({ user, data, reload }) {
  const [tab, setTab] = useState('pending');
  const [decideFor, setDecideFor] = useState(null);
  const isApprover = can(user, 'approver');
  const list = useMemo(() => data.requests.filter((r) => tab === 'all' ? true : r.status === tab), [data.requests, tab]);

  const tabs = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];
  return (
    <div>
      <PageHead title="Approval queue" sub={isApprover ? 'Review and decide on proposed codes.' : 'Track the status of codes you’ve requested.'}
        right={<div style={{ display: 'flex', gap: 6, background: C.ink3, padding: 4, borderRadius: 10, border: `1px solid ${C.line2}` }}>
          {tabs.map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === k ? ACCENT : 'transparent', color: tab === k ? ACCENT_TEXT : C.white }}>{v}</button>)}
        </div>} />
      <div style={{ ...card, overflow: 'hidden' }}>
        {list.length === 0
          ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Nothing here.</div>
          : <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {list.map((r) => (
              <div key={r.id} style={{ padding: '15px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{r.proposed.code}</span>
                    <StatusBadge status={r.status} />
                    <span style={{ fontSize: 12.5, color: C.white }}>{r.proposed.campName}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.fog2 }}>
                    Requested by {r.requested_by} · {fmtDate(r.requested_at)}
                    {r.note && <span style={{ color: C.fog }}> · “{r.note}”</span>}
                    {r.decision_note && <span style={{ color: C.fog }}> · decision: “{r.decision_note}”</span>}
                  </div>
                </div>
                {isApprover && r.status === 'pending' && (
                  <Btn variant="primary" style={{ padding: '8px 14px', fontSize: 12.5 }} onClick={() => setDecideFor(r)}>Review</Btn>
                )}
              </div>
            ))}
          </div>}
      </div>
      {decideFor && <DecideModal req={decideFor} onClose={() => setDecideFor(null)} onDone={() => { setDecideFor(null); reload(); }} />}
    </div>
  );
}
function DecideModal({ req, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(decision) {
    setBusy(true);
    try {
      const r = await api.decide(req.id, decision, note);
      if (decision === 'approve') {
        if (r && r.clickup && r.clickup.ok) toast('Approved — ClickUp task created');
        else if (r && r.clickup && r.clickup.error) toastErr('Approved, but ClickUp failed: ' + r.clickup.error);
        else toast('Approved — code is now active');
      } else toast(decision === 'changes' ? 'Changes requested' : 'Rejected');
      onDone();
    }
    catch (e) { toastErr(e.message); setBusy(false); }
  }
  const p = req.proposed;
  return (
    <Modal title="Review request" sub="Approve to add the code to the registry as active." onClose={onClose} width={520}>
      <div style={{ ...card, background: C.ink3, padding: 16, marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: ACCENT, marginBottom: 10 }}>{p.code}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 14px', fontSize: 12.5 }}>
          <span style={{ color: C.fog2 }}>Campaign</span><span>{p.campName}</span>
          <span style={{ color: C.fog2 }}>Requested by</span><span>{req.requested_by}</span>
          {req.note && <><span style={{ color: C.fog2 }}>Note</span><span>{req.note}</span></>}
        </div>
      </div>
      <Field label="Decision note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or context" style={inputStyle} /></Field>
      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 6 }}>
        <Btn variant="danger" disabled={busy} onClick={() => act('reject')}>Reject</Btn>
        <Btn variant="ghost" disabled={busy} onClick={() => act('changes')}>Request changes</Btn>
        <Btn variant="good" disabled={busy} onClick={() => act('approve')}>Approve</Btn>
      </div>
    </Modal>
  );
}

/* ----------------- UTM LINKS ----------------- */
const CONTENT_TYPES = [['button', 'Button'], ['text', 'Text'], ['image', 'Image']];
const MEDIUMS = [['email', 'Email'], ['website', 'Website']];
// UTM governance: keep parameter values clean & consistent — lowercase, hyphenated,
// no spaces or odd characters. Applied live as users type and again on the server.
const cleanSlug = (s) => String(s == null ? '' : s)
  .toLowerCase().trim()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9._-]/g, '')
  .replace(/-+/g, '-');
function Chip({ children, on, ghost, onClick }) {
  return <button onClick={onClick} style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: on ? 600 : 500, background: on ? ACCENT : C.ink3, color: on ? ACCENT_TEXT : C.white, border: `1px solid ${on ? ACCENT : C.line2}`, borderStyle: ghost && !on ? 'dashed' : 'solid' }}>{children}</button>;
}
function Seg({ k, v }) { return <span><span style={{ color: ACCENT }}>{k}=</span><span style={{ color: C.white }}>{v || '…'}</span><span style={{ color: ACCENT }}>&</span></span>; }
// Quick-pick destination sites for UTM links. Selecting one fills the base of
// the destination URL; the user then appends the page path.
const CAT_SITES = [
  ['https://parts.cat.com/', 'Parts · parts.cat.com'],
  ['https://shop.cat.com/', 'Shop · shop.cat.com'],
  ['https://rent.cat.com/', 'Rent · rent.cat.com'],
];
// Destination filters for the history view: [hostname, short label].
const DEST_FILTERS = [['parts.cat.com', 'Parts'], ['shop.cat.com', 'Shop'], ['rent.cat.com', 'Rent']];
const hostOf = (s) => { try { return new URL(s).hostname; } catch { return ''; } };
const iconBtn = {
  cursor: 'pointer', width: 30, height: 30, borderRadius: 8, flexShrink: 0,
  background: C.ink3, border: `1px solid ${C.line2}`, color: C.white, fontSize: 13,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .15s',
};
function Step({ n, label, param, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <span style={{ width: 21, height: 21, borderRadius: 6, flexShrink: 0, background: ACCENT_SOFT, color: ACCENT, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.white }}>{label}</span>
        {param && <span className="mono" style={{ fontSize: 10.5, color: C.fog2 }}>{param}</span>}
        {hint && <span style={{ fontSize: 11, color: C.fog2, marginLeft: 'auto', textAlign: 'right' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function CodePicker({ codes, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = codes.find((c) => c.id === value);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return codes.filter((c) => !ql || `${c.code} ${c.camp_name} ${c.business_unit} ${c.initiative}`.toLowerCase().includes(ql)).slice(0, 60);
  }, [codes, q]);
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => { setOpen((o) => !o); setQ(''); }}
        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ color: selected ? C.white : C.fog2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? <><span className="mono" style={{ color: ACCENT }}>{selected.code}</span> — {selected.camp_name}</> : 'Search an approved code…'}
        </span>
        <span style={{ color: C.fog2, flexShrink: 0 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 40, ...card, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a code, campaign, or division…"
              style={{ width: '100%', fontSize: 13, padding: '11px 13px', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.line}`, color: C.white, outline: 'none' }} />
            <div style={{ maxHeight: 270, overflowY: 'auto', padding: 5 }}>
              {filtered.length === 0 ? <div style={{ padding: 18, textAlign: 'center', color: C.fog2, fontSize: 12.5 }}>No matching codes.</div>
                : filtered.map((c) => (
                  <div key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
                    style={{ padding: '9px 11px', borderRadius: 8, cursor: 'pointer', background: c.id === value ? ACCENT_SOFT : 'transparent' }}
                    onMouseEnter={(e) => { if (c.id !== value) e.currentTarget.style.background = C.ink3; }}
                    onMouseLeave={(e) => { if (c.id !== value) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT }}>{c.code}</span><span style={{ fontSize: 12.5, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.camp_name}</span></div>
                    <div style={{ fontSize: 11, color: C.fog2 }}>{c.business_unit}{c.initiative ? ` · ${c.initiative}` : ''}</div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UtmLinks({ user, data, reload }) {
  const usable = data.codes.filter((c) => c.status === 'active');
  const [codeId, setCodeId] = useState('');
  const [content, setContent] = useState(''); const [cc, setCc] = useState('');
  const [medium, setMedium] = useState(''); const [mc, setMc] = useState('');
  const [title, setTitle] = useState(''); const [url, setUrl] = useState('');
  const [tab, setTab] = useState('build'); const [q, setQ] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [abCount, setAbCount] = useState(0); // 0 = single link; 2/3 = A/B(/C) variants
  const [confirmDel, setConfirmDel] = useState(null);
  const [delBusy, setDelBusy] = useState(false);

  async function removeLink() {
    if (!confirmDel) return;
    setDelBusy(true);
    try { await api.deleteLink(confirmDel.id); toast('Link deleted'); setConfirmDel(null); reload(); }
    catch (e) { toastErr(e.message); } finally { setDelBusy(false); }
  }

  // Group approved codes by division/industry for the dropdown.
  const codesByBU = useMemo(() => {
    const m = {};
    usable.forEach((c) => { (m[c.business_unit] || (m[c.business_unit] = [])).push(c); });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [usable]);

  const codeRec = usable.find((c) => c.id === codeId);
  const contentVal = content === '__c' ? cc.trim() : content;
  const mediumVal = medium === '__c' ? mc.trim() : medium;
  const campaign = codeRec ? 'clevelandbrothers-' + codeRec.code : '';
  const ready = codeRec && contentVal && mediumVal && title.trim() && url.trim();

  async function create(keep) {
    if (!ready) return;
    // A/B mode: build N variants under the same campaign, differing only by an
    // -a / -b / -c suffix on utm_content, so their performance can be compared.
    const variants = abCount >= 2 ? Array.from({ length: abCount }, (_, i) => String.fromCharCode(97 + i)) : [null];
    let made = 0, lastUrl = '', failed = 0;
    for (const v of variants) {
      const contentV = v ? cleanSlug(`${contentVal}-${v}`) : contentVal;
      try {
        const { url: full } = await api.createLink({ codeId, content: contentV, medium: mediumVal, title: title.trim(), baseUrl: url.trim() });
        lastUrl = full; made++;
      } catch (e) { failed++; toastErr(e.message); }
    }
    if (made) {
      navigator.clipboard?.writeText(lastUrl).catch(() => {});
      toast(abCount >= 2 ? `Created ${made} A/B variant${made > 1 ? 's' : ''}` : 'Link created & copied');
      setTitle(''); setUrl('');
      if (!keep) { setContent(''); setCc(''); setMedium(''); setMc(''); setAbCount(0); }
      reload();
    }
  }
  const links = useMemo(() => data.links.filter((l) => {
    if (q && !`${l.code} ${l.title} ${l.url} ${l.medium}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (destFilter) {
      const h = hostOf(l.base_url || l.url);
      if (destFilter === '__other') return !DEST_FILTERS.some(([host]) => host === h);
      return h === destFilter;
    }
    return true;
  }), [data.links, q, destFilter]);
  const destCounts = useMemo(() => {
    const m = {}; data.links.forEach((l) => { const h = hostOf(l.base_url || l.url); m[h] = (m[h] || 0) + 1; });
    return m;
  }, [data.links]);
  function exportLinks() {
    const head = ['Code', 'Title', 'Content', 'Medium', 'Campaign', 'Base URL', 'Full URL', 'Created By', 'Created'];
    const rows = data.links.map((l) => [l.code, l.title, l.content, l.medium, l.campaign, l.base_url, l.url, l.created_by, l.created_at]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'utm-links.csv'; a.click(); toast(`Exported ${data.links.length} links`);
  }

  return (
    <div>
      <PageHead title="UTM links" sub="Build a tracked link from an approved campaign code — tagged with UTM parameters so every click is attributed."
        right={<div style={{ display: 'flex', gap: 6, background: C.ink3, padding: 4, borderRadius: 10, border: `1px solid ${C.line2}` }}>
          <button onClick={() => setTab('build')} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === 'build' ? ACCENT : 'transparent', color: tab === 'build' ? ACCENT_TEXT : C.white }}>Build</button>
          <button onClick={() => setTab('history')} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === 'history' ? ACCENT : 'transparent', color: tab === 'history' ? ACCENT_TEXT : C.white }}>History ({data.links.length})</button>
        </div>} />
      {tab === 'build' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
          <div className="cb-fade" style={{ ...card, padding: 24 }}>
            <Step n={1} label="Campaign code" param="utm_campaign" hint="Search to filter">
              <CodePicker codes={usable} value={codeId} onChange={setCodeId} />
            </Step>
            <Step n={2} label="Link type" param="utm_content" hint="What the link sits on">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CONTENT_TYPES.map(([k, v]) => <Chip key={k} on={content === k} onClick={() => setContent(k)}>{v}</Chip>)}
                <Chip ghost on={content === '__c'} onClick={() => setContent('__c')}>+ Other</Chip>
              </div>
              {content === '__c' && <input value={cc} onChange={(e) => setCc(cleanSlug(e.target.value))} placeholder="custom content" className="mono" style={{ ...inputStyle, marginTop: 10 }} />}
            </Step>
            <Step n={3} label="Medium" param="utm_medium">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MEDIUMS.map(([k, v]) => <Chip key={k} on={medium === k} onClick={() => setMedium(k)}>{v}</Chip>)}
                <Chip ghost on={medium === '__c'} onClick={() => setMedium('__c')}>+ Other</Chip>
              </div>
              {medium === '__c' && <input value={mc} onChange={(e) => setMc(cleanSlug(e.target.value))} placeholder="custom medium" className="mono" style={{ ...inputStyle, marginTop: 10 }} />}
            </Step>
            <Step n={4} label="Title" param="utm_term" hint="lowercase · auto-formatted">
              <input value={title} onChange={(e) => setTitle(cleanSlug(e.target.value))} placeholder="e.g. spring-promo-hero" className="mono" style={inputStyle} />
            </Step>
            <Step n={5} label="Destination" param="base URL" hint="Pick a site, then add the path">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {CAT_SITES.map(([base, label]) => <Chip key={base} on={url.startsWith(base)} onClick={() => setUrl(base)}>{label}</Chip>)}
                <Chip ghost on={!!url && !CAT_SITES.some(([base]) => url.startsWith(base))} onClick={() => setUrl('')}>+ Other</Chip>
              </div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://rent.cat.com/your-page" style={inputStyle} />
            </Step>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: C.fog, fontWeight: 600, marginRight: 2 }}>A/B test</span>
              {[[0, 'Off'], [2, '2 · A/B'], [3, '3 · A/B/C']].map(([nn, lab]) => <Chip key={nn} on={abCount === nn} onClick={() => setAbCount(nn)}>{lab}</Chip>)}
              {abCount >= 2 && <span style={{ fontSize: 11, color: C.fog2 }}>{contentVal ? `Builds: ${contentVal}-a, ${contentVal}-b${abCount === 3 ? `, ${contentVal}-c` : ''}` : `Builds ${abCount} variants`}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
              <Btn disabled={!ready} onClick={() => create(true)} style={{ flex: 1 }}>{abCount >= 2 ? 'Create variants & keep' : 'Create & keep code'}</Btn>
              <Btn variant="ghost" disabled={!ready} onClick={() => create(false)} style={{ flex: 1 }}>Create &amp; reset</Btn>
            </div>
          </div>
          <div className="cb-fade" style={{ ...card, padding: 22, position: 'sticky', top: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -22, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,17,.14), transparent 70%)', pointerEvents: 'none' }} />
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.fog2, marginBottom: 13, position: 'relative' }}>Live preview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, position: 'relative' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ready ? C.good : C.fog2, boxShadow: ready ? '0 0 0 4px rgba(52,199,89,.16)' : 'none' }} />
              <span style={{ fontSize: 12, color: ready ? C.good : C.fog2, fontWeight: 600 }}>{ready ? 'Ready to create' : 'Complete the steps to build'}</span>
            </div>
            <div className="mono" style={{ fontSize: 12, lineHeight: 1.75, wordBreak: 'break-all', color: C.fog, minHeight: 66, background: C.ink, borderRadius: 10, border: `1px solid ${C.line}`, padding: 14, position: 'relative' }}>
              {url || contentVal || campaign
                ? <><span style={{ color: C.white }}>{url || 'https://your-link'}</span>{(url || '').includes('?') ? '&' : '?'}<Seg k="utm_content" v={contentVal} /><Seg k="utm_medium" v={mediumVal} /><Seg k="utm_campaign" v={campaign} /><Seg k="utm_term" v={title.trim()} /></>
                : <span style={{ color: C.fog2, fontStyle: 'italic', fontFamily: 'Inter' }}>Your tagged link appears here as you build it.</span>}
            </div>
            {campaign && <div style={{ marginTop: 13, fontSize: 11.5, color: C.fog2, position: 'relative' }}>Campaign: <span className="mono" style={{ color: ACCENT }}>{campaign}</span></div>}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
            <Search value={q} onChange={setQ} placeholder="Search links by code, title, URL…" />
            <Btn variant="ghost" onClick={exportLinks}>Export CSV</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: C.fog2, fontWeight: 600, marginRight: 2 }}>Destination:</span>
            <Chip on={destFilter === ''} onClick={() => setDestFilter('')}>All ({data.links.length})</Chip>
            {DEST_FILTERS.map(([host, label]) => (
              <Chip key={host} on={destFilter === host} onClick={() => setDestFilter(host)}>{label} ({destCounts[host] || 0})</Chip>
            ))}
            <Chip ghost on={destFilter === '__other'} onClick={() => setDestFilter('__other')}>Other</Chip>
          </div>
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.7fr 1.2fr 0.6fr 116px', gap: 12, padding: '11px 18px', borderBottom: `1px solid ${C.line}`, background: C.ink3, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.fog2, fontWeight: 600 }}>
              <span>Link</span><span>Medium</span><span>Destination</span><span>Created</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {links.length === 0
              ? <div style={{ padding: 48, textAlign: 'center', color: C.fog2, fontSize: 13 }}>{(q || destFilter) ? 'No links match this filter.' : <>No links yet. Build one from the <b style={{ color: C.white }}>Build</b> tab.</>}</div>
              : <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                {links.map((l, i) => {
                  let host = ''; try { host = new URL(l.base_url || l.url).hostname; } catch {}
                  return (
                    <div key={l.id} className="cb-fade" style={{ display: 'grid', gridTemplateColumns: '1.7fr 0.7fr 1.2fr 0.6fr 116px', gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: i < links.length - 1 ? `1px solid ${C.line}` : 'none', animationDelay: `${Math.min(i, 12) * 30}ms`, transition: 'background .15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <Badge>{l.code}</Badge>
                          <span style={{ fontSize: 12.5, color: C.white, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 10.5, color: C.fog2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</div>
                      </div>
                      <span><Badge color={C.fog} bg="rgba(110,110,120,.16)">{l.medium}</Badge></span>
                      <span className="mono" style={{ fontSize: 11.5, color: C.fog, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{host || '—'}</span>
                      <span style={{ fontSize: 11, color: C.fog2 }}>{timeAgo(l.created_at)}</span>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button title="Open link" onClick={() => window.open(l.url, '_blank')} style={iconBtn}>↗</button>
                        <button title="Copy link" onClick={() => { navigator.clipboard?.writeText(l.url); toast('Copied'); }} style={iconBtn}>⧉</button>
                        {can(user, 'approver') && <button title="Delete link" onClick={() => setConfirmDel(l)} style={{ ...iconBtn, color: '#FFB020' }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FFB020')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line2)}>🗑</button>}
                      </div>
                    </div>
                  );
                })}
              </div>}
          </div>
        </div>
      )}
      {confirmDel && (
        <Modal title="Delete UTM link" sub="This removes it from the registry." onClose={() => setConfirmDel(null)} width={440}>
          <p style={{ fontSize: 13.5, color: C.fog, lineHeight: 1.6, marginBottom: 14 }}>
            Delete this tracked link? This only removes it from Catalyst's history — it doesn't affect any short link already pointing at it.
          </p>
          <div style={{ background: C.ink3, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}><Badge>{confirmDel.code}</Badge><span style={{ fontSize: 12.5, color: C.white, fontWeight: 500 }}>{confirmDel.title}</span></div>
            <div className="mono" style={{ fontSize: 11, color: C.fog2, wordBreak: 'break-all' }}>{confirmDel.url}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={removeLink} disabled={delBusy}>{delBusy ? 'Deleting…' : 'Delete link'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------- TAXONOMY ----------------- */
function Taxonomy({ user, data, reload }) {
  const isAdmin = can(user, 'admin');
  const [tab, setTab] = useState('bu');
  const t = data.taxonomy;
  if (!isAdmin) return (
    <div>
      <PageHead title="Taxonomy" sub="The controlled vocabulary behind every code." />
      <div style={{ ...card, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Admin access required</div>
        <div style={{ color: C.fog, fontSize: 13 }}>Only administrators can edit the taxonomy.</div>
      </div>
    </div>
  );
  async function add(body) { try { await api.addTaxonomy(body); toast('Added'); reload(); } catch (e) { toastErr(e.message); } }
  const tabs = [['bu', 'Business units'], ['init', 'Initiatives'], ['camp', 'Campaigns']];
  const allInits = {}; Object.values(t.initiatives).forEach((g) => Object.entries(g).forEach(([k, v]) => (allInits[k] = v)));
  return (
    <div>
      <PageHead title="Taxonomy" sub="Manage the controlled vocabulary. Codes are built from these values."
        right={<div style={{ display: 'flex', gap: 6, background: C.ink3, padding: 4, borderRadius: 10, border: `1px solid ${C.line2}` }}>
          {tabs.map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === k ? ACCENT : 'transparent', color: tab === k ? ACCENT_TEXT : C.white }}>{v}</button>)}
        </div>} />
      {tab === 'bu' && <TaxoPane title="Business unit" addFields={[['code', 'Code', 1, 70], ['name', 'Name', 40, 220]]} onAdd={(vals) => add({ type: 'bu', code: vals.code, name: vals.name })}
        list={Object.entries(t.businessUnits).map(([k, v]) => ({ code: k, name: v, meta: `${Object.keys(t.initiatives[k] || {}).length} initiatives` }))} />}
      {tab === 'init' && <TaxoSelectPane title="Initiative" parentLabel="Business unit" parents={t.businessUnits} group={t.initiatives}
        onAdd={(parent, vals) => add({ type: 'initiative', buCode: parent, code: vals.code, name: vals.name })} codeLen={2} />}
      {tab === 'camp' && <TaxoSelectPane title="Campaign" parentLabel="Initiative" parents={allInits} group={t.campaigns}
        onAdd={(parent, vals) => add({ type: 'campaign', initCode: parent, code: vals.code, name: vals.name })} codeLen={4} />}
    </div>
  );
}
function TaxoPane({ title, addFields, onAdd, list }) {
  const [v, setV] = useState({});
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ ...card, padding: 20 }}>
        <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add {title.toLowerCase()}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {addFields.map(([key, label, max, w]) => (
            <div key={key} style={{ flex: key === 'name' ? 1 : 'none' }}>
              <label style={{ fontSize: 11, color: C.fog, fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
              <input value={v[key] || ''} maxLength={max} onChange={(e) => setV({ ...v, [key]: e.target.value })} className={key === 'code' ? 'mono' : ''} style={{ ...inputStyle, width: w }} />
            </div>
          ))}
          <Btn onClick={() => { if (!v.code || !v.name) return toastErr('Fill all fields'); onAdd(v); setV({}); }}>Add</Btn>
        </div>
      </div>
      <div style={{ ...card, padding: 20 }}>
        <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Current ({list.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
          {list.map((it) => (
            <div key={it.code} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '9px 12px', borderRadius: 9, background: C.ink3 }}>
              <span className="mono" style={{ fontWeight: 600, color: ACCENT, width: 28 }}>{it.code}</span>
              <span style={{ fontSize: 13 }}>{it.name}</span>
              {it.meta && <span style={{ marginLeft: 'auto', fontSize: 11, color: C.fog2 }}>{it.meta}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function TaxoSelectPane({ title, parentLabel, parents, group, onAdd, codeLen }) {
  const [parent, setParent] = useState(Object.keys(parents)[0] || '');
  const [v, setV] = useState({});
  const items = group[parent] || {};
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ ...card, padding: 20 }}>
        <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add {title.toLowerCase()}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160 }}>
            <label style={{ fontSize: 11, color: C.fog, fontWeight: 600, display: 'block', marginBottom: 5 }}>{parentLabel}</label>
            <select value={parent} onChange={(e) => setParent(e.target.value)} style={inputStyle}>{Object.entries(parents).map(([k, val]) => <option key={k} value={k}>{val} ({k})</option>)}</select>
          </div>
          <div><label style={{ fontSize: 11, color: C.fog, fontWeight: 600, display: 'block', marginBottom: 5 }}>Code</label><input value={v.code || ''} maxLength={codeLen} onChange={(e) => setV({ ...v, code: e.target.value })} className="mono" style={{ ...inputStyle, width: 90 }} /></div>
          <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: C.fog, fontWeight: 600, display: 'block', marginBottom: 5 }}>Name</label><input value={v.name || ''} onChange={(e) => setV({ ...v, name: e.target.value })} style={inputStyle} /></div>
          <Btn onClick={() => { if (!v.code || !v.name) return toastErr('Fill all fields'); onAdd(parent, v); setV({}); }}>Add</Btn>
        </div>
      </div>
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>{title}s</h3>
          <select value={parent} onChange={(e) => setParent(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>{Object.entries(parents).map(([k, val]) => <option key={k} value={k}>{val}</option>)}</select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {Object.keys(items).length === 0 ? <div style={{ color: C.fog2, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>None yet.</div>
            : Object.entries(items).map(([k, val]) => (
              <div key={k} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '9px 12px', borderRadius: 9, background: C.ink3 }}>
                <span className="mono" style={{ fontWeight: 600, color: ACCENT, width: 36 }}>{k}</span><span style={{ fontSize: 13 }}>{val}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------- AUDIT LOG ----------------- */
function AuditLog({ user, reload }) {
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.audit().then((d) => setEvents(d.events)).catch((e) => toastErr(e.message)); }, []);
  const filtered = useMemo(() => !q ? events : events.filter((e) => `${e.actor} ${e.action} ${e.entity} ${e.entity_id || ''}`.toLowerCase().includes(q.toLowerCase())), [events, q]);
  return (
    <div>
      <PageHead title="Audit log" sub="Every change, who made it, and when." />
      <div style={{ marginBottom: 14 }}><Search value={q} onChange={setQ} placeholder="Search by actor, action, entity…" /></div>
      <div style={{ ...card, overflow: 'hidden' }}>
        {filtered.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No events.</div>
          : <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {filtered.map((e) => (
              <div key={e.id} style={{ padding: '12px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 11, color: ACCENT, width: 180, flexShrink: 0 }}>{e.action}</span>
                <span style={{ fontSize: 12.5, flex: 1 }}>
                  <b style={{ fontWeight: 600 }}>{e.actor}</b>
                  <span style={{ color: C.fog }}> · {e.entity}{e.entity_id ? ` ${e.entity_id}` : ''}</span>
                  {e.after?.code && <span style={{ color: C.fog }}> · {e.after.code}</span>}
                  {e.after?.status && <span style={{ color: C.fog }}> → {e.after.status}</span>}
                </span>
                <span style={{ fontSize: 11, color: C.fog2, flexShrink: 0 }}>{fmtDate(e.created_at)}</span>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}

/* ----------------- USERS (admin) ----------------- */
const ROLE_OPTIONS = [
  ['viewer', 'Viewer — browse only'],
  ['user', 'User — request codes, build links'],
  ['approver', 'Approver — approve & manage codes'],
  ['admin', 'Admin — full access, manage users'],
];
function Users({ user }) {
  const isAdmin = can(user, 'admin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: '' });
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.users().then((d) => setUsers(d.users)).catch((e) => toastErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!isAdmin) return (
    <div>
      <PageHead title="Users" sub="Manage who can access the portal." />
      <div style={{ ...card, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Admin access required</div>
        <div style={{ color: C.fog, fontSize: 13 }}>Only administrators can invite or manage users.</div>
      </div>
    </div>
  );

  async function invite() {
    if (!form.name || !form.email || !form.password) return toastErr('Fill all fields');
    if (form.password.length < 8) return toastErr('Password must be at least 8 characters');
    setBusy(true);
    try {
      const res = await api.createUser(form);
      if (res.emailed) toast(`Invite emailed to ${form.email}`);
      else { toast(`${form.name} added`); if (res.emailError) toastErr(res.emailError); }
      setForm({ name: '', email: '', role: 'user', password: '' });
      setShow(false);
      load();
    } catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }

  async function doDelete() {
    if (!confirmDel) return;
    setBusy(true);
    try {
      await api.deleteUser(confirmDel.id);
      toast(`Removed ${confirmDel.name}`);
      setConfirmDel(null);
      load();
    } catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHead title="Users" sub={`${users.length} ${users.length === 1 ? 'person has' : 'people have'} access`}
        right={<Btn onClick={() => setShow(true)}>+ Invite user</Btn>} />
      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading…</div>
          : users.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No users yet.</div>
          : users.map((u) => (
            <div key={u.id} style={{ padding: '13px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 13, alignItems: 'center' }}>
              <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: ACCENT, color: ACCENT_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                {u.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}{u.id === user.id && <span style={{ color: C.fog2, fontWeight: 500 }}> · you</span>}</div>
                <div style={{ fontSize: 12, color: C.fog }}>{u.email}</div>
              </div>
              {!u.has_password && <Badge color={C.warn} bg="rgba(255,176,32,.14)">no password</Badge>}
              <Badge>{u.role}</Badge>
              <span style={{ fontSize: 11, color: C.fog2, flexShrink: 0, width: 96, textAlign: 'right' }}>{fmtDate(u.created_at)}</span>
              {u.id === user.id
                ? <span style={{ width: 30, flexShrink: 0 }} />
                : <button title={`Remove ${u.name}`} onClick={() => setConfirmDel(u)} style={{ ...iconBtn, color: '#FFB020' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FFB020')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line2)}>🗑</button>}
            </div>
          ))}
      </div>
      {show && (
        <Modal title="Invite a user" sub="They sign in with this email and password." onClose={() => setShow(false)} width={460}>
          <Field label="Full name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" style={inputStyle} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@clevelandbrothers.com" style={inputStyle} />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              {ROLE_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </Field>
          <Field label="Temporary password" hint="At least 8 characters. Emailed to the user in a branded invite (if email is configured).">
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set an initial password" className="mono" style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <Btn variant="ghost" onClick={() => setShow(false)}>Cancel</Btn>
            <Btn onClick={invite} disabled={busy}>{busy ? 'Inviting…' : 'Invite user'}</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Remove user" sub="This permanently deletes the account." onClose={() => setConfirmDel(null)} width={420}>
          <p style={{ fontSize: 13.5, color: C.fog, lineHeight: 1.6, marginBottom: 18 }}>
            Permanently delete <b style={{ color: C.white }}>{confirmDel.name}</b> (<span className="mono">{confirmDel.email}</span>)? They'll be cleared from the system immediately and signed out. This can't be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doDelete} disabled={busy}>{busy ? 'Removing…' : 'Delete user'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------- LINK HUB (self-hosted short links) ----------------- */
const statLabel = { fontSize: 11.5, color: C.fog, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 };
function Bars({ rows }) {
  if (!rows || rows.length === 0) return <span style={{ fontSize: 12.5, color: C.fog2 }}>No data yet.</span>;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
          <span title={r.label} style={{ color: C.fog, width: 104, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{r.label}</span>
          <div style={{ flex: 1, height: 7, borderRadius: 99, background: C.ink3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(r.n / max) * 100}%`, background: ACCENT, borderRadius: 99 }} /></div>
          <span className="mono" style={{ width: 34, textAlign: 'right', color: C.white }}>{r.n}</span>
        </div>
      ))}
    </div>
  );
}
function LinkHub({ user }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ longUrl: '', title: '', slug: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [q, setQ] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [statsFor, setStatsFor] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.hub().then((d) => setLinks(d.links)).catch((e) => toastErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.longUrl.trim()) return toastErr('Enter a destination URL');
    setBusy(true);
    try {
      const r = await api.createHubLink(form);
      setResult(r);
      setLinks((ls) => [r, ...ls]);
      navigator.clipboard?.writeText(r.shortUrl).catch(() => {});
      toast('Short link created & copied');
      setForm({ longUrl: '', title: '', slug: '' });
    } catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }
  async function doDelete() {
    if (!confirmDel) return;
    setDelBusy(true);
    try { await api.deleteHubLink(confirmDel.id); toast('Link deleted'); setConfirmDel(null); load(); }
    catch (e) { toastErr(e.message); } finally { setDelBusy(false); }
  }
  async function openStats(l) {
    setStatsFor(l); setStats(null);
    try { setStats(await api.hubStats(l.id)); } catch (e) { toastErr(e.message); }
  }

  const filtered = useMemo(() => !q ? links : links.filter((l) => `${l.slug} ${l.long_url} ${l.title || ''}`.toLowerCase().includes(q.toLowerCase())), [links, q]);
  const totalClicks = useMemo(() => links.reduce((s, l) => s + (l.clicks || 0), 0), [links]);
  const cols = '1.6fr 1.4fr 70px 104px';

  return (
    <div>
      <PageHead title="Link Hub" sub="Cleveland Brothers' own short links — shortened, QR-ready, and tracked in-house. No third party." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start', marginBottom: 22 }}>
        <div className="cb-fade" style={{ ...card, padding: 22 }}>
          <Field label="Destination URL" param="long URL">
            <input value={form.longUrl} onChange={(e) => setForm({ ...form, longUrl: e.target.value })} placeholder="https://www.clevelandbrothers.com/page" style={inputStyle} />
          </Field>
          <Field label="Label" hint="Optional — helps you find this link later.">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Spring rental flyer" style={inputStyle} />
          </Field>
          <Field label="Custom back-half" hint="Optional — leave blank for a random code.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="mono" style={{ fontSize: 12.5, color: C.fog2 }}>/s/</span>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="spring-rental" className="mono" style={inputStyle} />
            </div>
          </Field>
          <Btn disabled={busy} onClick={create} style={{ width: '100%' }}>{busy ? 'Creating…' : 'Create short link + QR'}</Btn>
        </div>

        <div className="cb-fade" style={{ ...card, padding: 20, position: 'sticky', top: 0 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.fog2, marginBottom: 14 }}>Result</div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13 }}>
              <QR value={`${result.shortUrl}?s=qr`} size={166} label={result.slug} />
              <a href={result.shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 14, fontWeight: 600, color: ACCENT, wordBreak: 'break-all', textAlign: 'center' }}>{result.shortUrl}</a>
              <button onClick={() => { navigator.clipboard?.writeText(result.shortUrl); toast('Copied'); }} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: C.ink3, border: `1px solid ${C.line2}`, color: C.white }}>Copy short link</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: C.fog2, fontSize: 13, padding: '30px 0' }}>
              <div style={{ fontSize: 26, marginBottom: 10, opacity: 0.6 }}>🔗</div>
              Your short link and QR appear here.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>Short links<span style={{ color: C.fog, fontWeight: 500, fontSize: 13 }}> · {totalClicks} total clicks</span></h3>
        <div style={{ width: 260 }}><Search value={q} onChange={setQ} placeholder="Search short links…" /></div>
      </div>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '11px 18px', borderBottom: `1px solid ${C.line}`, background: C.ink3, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.fog2, fontWeight: 600 }}>
          <span>Short link</span><span>Destination</span><span style={{ textAlign: 'right' }}>Clicks</span><span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {loading ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading…</div>
          : filtered.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No short links yet — create one above.</div>
          : <div style={{ maxHeight: 'calc(100vh - 470px)', overflowY: 'auto' }}>
            {filtered.map((l) => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.line}` }}>
                <div style={{ minWidth: 0 }}>
                  <a href={l.shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 13, fontWeight: 600, color: ACCENT, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>/s/{l.slug}</a>
                  {l.title && <span style={{ fontSize: 11.5, color: C.fog2 }}>{l.title}</span>}
                </div>
                <div className="mono" style={{ fontSize: 11, color: C.fog, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{l.long_url}</div>
                <button onClick={() => openStats(l)} title="View analytics" style={{ textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Archivo', fontWeight: 800, fontSize: 16, color: l.clicks > 0 ? ACCENT : C.fog2 }}>{l.clicks}</button>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button title="Analytics" onClick={() => openStats(l)} style={iconBtn}>📊</button>
                  <button title="Copy" onClick={() => { navigator.clipboard?.writeText(l.shortUrl); toast('Copied'); }} style={iconBtn}>⧉</button>
                  <details style={{ position: 'relative' }}>
                    <summary style={{ ...iconBtn, listStyle: 'none' }}>▦</summary>
                    <div style={{ position: 'absolute', right: 0, marginTop: 6, zIndex: 30, ...card, padding: 14, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                      <QR value={`${l.shortUrl}?s=qr`} size={150} label={l.slug} />
                    </div>
                  </details>
                  {can(user, 'approver') && <button title="Delete" onClick={() => setConfirmDel(l)} style={{ ...iconBtn, color: '#FFB020' }}>🗑</button>}
                </div>
              </div>
            ))}
          </div>}
      </div>

      {statsFor && (
        <Modal title={`/s/${statsFor.slug}`} sub={statsFor.long_url} onClose={() => setStatsFor(null)} width={520}>
          {!stats ? <div style={{ padding: 30, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading analytics…</div>
            : <div>
              <div style={{ display: 'flex', gap: 11, marginBottom: 18 }}>
                <div style={{ ...card, padding: '13px 16px', flex: 1, background: C.ink3 }}><div style={{ fontSize: 11, color: C.fog2, marginBottom: 4 }}>Total</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 27, color: ACCENT }}>{stats.total}</div></div>
                <div style={{ ...card, padding: '13px 16px', flex: 1, background: C.ink3 }}><div style={{ fontSize: 11, color: C.fog2, marginBottom: 4 }}>QR scans</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 27 }}>{stats.bySource.find((r) => r.label === 'qr')?.n || 0}</div></div>
                <div style={{ ...card, padding: '13px 16px', flex: 1, background: C.ink3 }}><div style={{ fontSize: 11, color: C.fog2, marginBottom: 4 }}>Link clicks</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 27 }}>{stats.bySource.find((r) => r.label === 'link')?.n || 0}</div></div>
              </div>
              <div style={statLabel}>Activity · last 14 days</div>
              <TrendChart points={stats.series} height={80} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginTop: 20 }}>
                <div><div style={statLabel}>Device</div><Bars rows={stats.byDevice} /></div>
                <div><div style={statLabel}>Browser</div><Bars rows={stats.byBrowser} /></div>
                <div><div style={statLabel}>Operating system</div><Bars rows={stats.byOs} /></div>
                <div><div style={statLabel}>Country</div><Bars rows={stats.byCountry} /></div>
                <div><div style={statLabel}>City</div><Bars rows={stats.byCity} /></div>
                <div><div style={statLabel}>Referrer</div><Bars rows={stats.byReferrer} /></div>
              </div>
            </div>}
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Delete short link" sub="This removes the link and its click history." onClose={() => setConfirmDel(null)} width={420}>
          <p style={{ fontSize: 13.5, color: C.fog, lineHeight: 1.6, marginBottom: 18 }}>Delete <span className="mono" style={{ color: C.white }}>/s/{confirmDel.slug}</span>? Anyone who scans the QR or clicks the link afterward will hit a dead link. This can't be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doDelete} disabled={delBusy}>{delBusy ? 'Deleting…' : 'Delete link'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------- APP SHELL ----------------- */
const NAV_SECTIONS = [
  ['', [
    ['dashboard', 'Dashboard', '◧', 'viewer'],
  ]],
  ['Campaigns', [
    ['codes', 'Campaign codes', '⬢', 'viewer'],
    ['approvals', 'Approvals', '✓', 'user'],
    ['taxonomy', 'Taxonomy', '⊞', 'viewer'],
  ]],
  ['Links & tracking', [
    ['links', 'UTM links', '⛓', 'user'],
    ['hub', 'Link Hub', '🔗', 'user'],
    ['/qr-generation', 'QR Platform', '✦', 'user'],
  ]],
  ['Administration', [
    ['audit', 'Audit log', '◷', 'approver'],
    ['users', 'Users', '👤', 'admin'],
  ]],
];

/* ----------------- COMMAND PALETTE (⌘K) ----------------- */
function CommandPalette({ data, go, user, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const items = useMemo(() => {
    const list = [];
    NAV_SECTIONS.forEach(([section, navs]) => navs.forEach(([k, label, icon, min]) => {
      if (can(user, min)) list.push({ type: 'Page', label, icon, sub: section || 'Go to', action: () => go(k) });
    }));
    (data.codes || []).forEach((c) => list.push({ type: 'Code', label: c.code, sub: c.camp_name, icon: '⬢', action: () => go('codes') }));
    (data.links || []).forEach((l) => list.push({ type: 'Link', label: l.title, sub: `${l.code} · ${l.medium}`, icon: '⛓', action: () => go('links') }));
    return list;
  }, [data, user, go]);
  const filtered = useMemo(() => {
    if (!q.trim()) return items.filter((i) => i.type === 'Page');
    const ql = q.toLowerCase();
    return items.filter((i) => `${i.label} ${i.sub || ''} ${i.type}`.toLowerCase().includes(ql)).slice(0, 40);
  }, [items, q]);
  useEffect(() => { setSel(0); }, [q]);
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = filtered[sel]; if (it) { it.action(); onClose(); } }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}>
      <div onClick={(e) => e.stopPropagation()} className="cb-pop" style={{ width: 580, maxWidth: '92vw', ...card, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,.55)' }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search pages, campaign codes, links…"
          style={{ width: '100%', fontSize: 15, padding: '16px 18px', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.line}`, color: C.white, outline: 'none' }} />
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0
            ? <div style={{ padding: 30, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No matches for “{q}”.</div>
            : filtered.map((it, i) => (
              <div key={i} onMouseEnter={() => setSel(i)} onClick={() => { it.action(); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', background: i === sel ? ACCENT_SOFT : 'transparent' }}>
                <span style={{ width: 27, height: 27, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.ink3, color: i === sel ? ACCENT : C.fog2, fontSize: 13 }}>{it.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
                  {it.sub && <span style={{ display: 'block', fontSize: 11.5, color: C.fog2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.sub}</span>}
                </span>
                <span className="mono" style={{ fontSize: 10, color: C.fog2, textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>{it.type}</span>
              </div>
            ))}
        </div>
        <div style={{ padding: '9px 16px', borderTop: `1px solid ${C.line}`, fontSize: 11, color: C.fog2, display: 'flex', gap: 16 }}>
          <span><b style={{ color: C.fog }}>↑↓</b> navigate</span><span><b style={{ color: C.fog }}>↵</b> open</span><span><b style={{ color: C.fog }}>esc</b> close</span>
        </div>
      </div>
    </div>
  );
}
export default function Portal() {
  const [user, setUser] = useState(undefined); // undefined=loading, null=signed out
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState({ codes: [], links: [], requests: [], pending: [], taxonomy: { departments: {}, businessUnits: {}, initiatives: {}, campaigns: {} } });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { api.session().then((d) => setUser(d.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { try { const t = localStorage.getItem('cb-theme'); if (t === 'light' || t === 'dark') setTheme(t); } catch {} }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); try { localStorage.setItem('cb-theme', theme); } catch {} }, [theme]);
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [codes, links, requests, taxonomy] = await Promise.all([
        api.codes(), api.links(), api.requests().catch(() => ({ requests: [] })), api.taxonomy(),
      ]);
      setData({
        codes: codes.codes, links: links.links, requests: requests.requests,
        pending: requests.requests.filter((r) => r.status === 'pending'), taxonomy,
      });
    } catch (e) { toastErr(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) reload(); }, [user, reload]);

  if (user === undefined) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fog2 }}>Loading…</div>;
  if (!user) return <><SignIn onSignedIn={setUser} /><ToastHost /></>;

  const brand = BRANDS.corporate;
  const themeVars = { '--accent': brand.accent, '--accent-text': brand.accentText, '--accent-soft': brand.accentSoft, height: '100%', display: 'flex' };
  const props = { user, data, reload, go: setView };

  async function signOut() { await api.signout().catch(() => {}); setUser(null); }

  return (
    <div style={themeVars}>
      <aside style={{ width: 244, flexShrink: 0, background: C.ink2, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', padding: '18px 14px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 8px 16px' }}>
          <BrandLogo brand={BRANDS.corporate} height={26} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 14px' }}>
          <span style={{ fontSize: 10.5, color: ACCENT, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700 }}>{APP_NAME}</span>
          <span style={{ flex: 1, height: 1, background: C.line }} />
        </div>
        <button onClick={() => setPaletteOpen(true)} title="Search (Cmd/Ctrl + K)" style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', marginBottom: 10, borderRadius: 10, cursor: 'pointer', background: C.ink3, border: `1px solid ${C.line2}`, color: C.fog, fontSize: 13, transition: 'border-color .14s' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line2)}>
          <span style={{ color: C.fog2 }}>⌕</span>
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <span className="mono" style={{ fontSize: 10.5, color: C.fog2, border: `1px solid ${C.line2}`, borderRadius: 5, padding: '1px 5px' }}>⌘K</span>
        </button>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {NAV_SECTIONS.map(([section, items]) => {
            const visible = items.filter(([, , , min]) => can(user, min));
            if (!visible.length) return null;
            return (
              <div key={section || 'main'} style={{ marginBottom: 8 }}>
                {section && <div style={{ fontSize: 9.5, color: C.fog2, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, padding: '8px 12px 6px' }}>{section}</div>}
                {visible.map(([k, label, icon]) => {
                  const isLink = k.startsWith('/');
                  const on = view === k; const locked = k === 'taxonomy' && !can(user, 'admin');
                  const badge = k === 'approvals' && data.pending.length > 0 ? data.pending.length : null;
                  return (
                    <button key={k} onClick={() => isLink ? (window.location.href = k) : setView(k)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', background: on ? ACCENT_SOFT : 'transparent', color: on ? C.white : C.fog, fontWeight: on ? 600 : 500, fontSize: 13.5, transition: 'background .14s, color .14s' }}
                      onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = C.ink3; e.currentTarget.style.color = C.white; } }}
                      onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fog; } }}>
                      {on && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 99, background: ACCENT }} />}
                      <span style={{ width: 18, textAlign: 'center', color: on ? ACCENT : C.fog2, fontSize: 14 }}>{icon}</span>
                      <span style={{ flex: 1 }}>{label}{isLink && <span style={{ color: C.fog2, marginLeft: 4 }}>↗</span>}</span>
                      {badge && <span style={{ fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, background: ACCENT, color: ACCENT_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>}
                      {locked && <span style={{ fontSize: 11, color: C.fog2 }}>🔒</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: ACCENT, color: ACCENT_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5 }}>{user.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</span>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10.5, color: C.fog2, textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: 'pointer', background: C.ink3, border: `1px solid ${C.line2}`, color: C.fog, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .14s, color .14s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = C.white; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.color = C.fog; }}>{theme === 'dark' ? '☀' : '☾'}</button>
          </div>
          <button onClick={signOut} style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, background: 'transparent', border: `1px solid ${C.line2}`, color: C.fog, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'border-color .14s, color .14s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = C.white; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line2; e.currentTarget.style.color = C.fog; }}>Sign out</button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 32px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(900px 500px at 92% -16%, rgba(255,205,17,.06), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {view === 'dashboard' && <Dashboard {...props} />}
          {view === 'codes' && <CampaignCodes {...props} />}
          {view === 'approvals' && <Approvals {...props} />}
          {view === 'links' && <UtmLinks {...props} />}
          {view === 'hub' && <LinkHub {...props} />}
          {view === 'taxonomy' && <Taxonomy {...props} />}
          {view === 'audit' && <AuditLog {...props} />}
          {view === 'users' && <Users {...props} />}
        </div>
      </main>
      {paletteOpen && <CommandPalette data={data} go={setView} user={user} onClose={() => setPaletteOpen(false)} />}
      <ToastHost />
    </div>
  );
}
