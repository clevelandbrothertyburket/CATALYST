'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './api';
import { C, card, inputStyle, Btn, Field, Modal, Search, Badge, BrandLogo, BRANDS, ACCENT, ACCENT_SOFT } from './ui';
import { QR } from './QR';

/* lightweight toast */
let toastFn = () => {};
function Toast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => { toastFn = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2400); }; }, []);
  if (!msg) return null;
  const err = msg.startsWith('!');
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 200, background: C.white, color: C.ink, fontWeight: 600, fontSize: 13.5, padding: '11px 20px', borderRadius: 99, boxShadow: '0 12px 40px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: err ? C.warn : C.good }} />{err ? msg.slice(1) : msg}
    </div>
  );
}
const toast = (m) => toastFn(m);
const toastErr = (m) => toastFn('!' + m);

function Spark({ points, height = 84 }) {
  const w = 100, max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const co = points.map((p, i) => [i * step, height - (p.value / max) * (height - 12) - 6]);
  const line = co.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs><linearGradient id="qpg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FFCD11" stopOpacity="0.32" /><stop offset="100%" stopColor="#FFCD11" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#qpg)" />
      <path d={line} fill="none" stroke="#FFCD11" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {co.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.7" fill="#FFCD11" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

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
const statLabel = { fontSize: 11.5, color: C.fog, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 };
const iconBtn = { cursor: 'pointer', width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: C.ink3, border: `1px solid ${C.line2}`, color: C.white, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const can = (u, r) => { const RANK = { viewer: 0, user: 1, approver: 2, admin: 3 }; return u && (RANK[u.role] ?? -1) >= (RANK[r] ?? 99); };

const bcols = '1.3fr 1.6fr 90px 110px';
const fmtD = (s) => { try { return new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };

function BitlyAccount({ data, loading, q, setQ, onReload }) {
  const [sub, setSub] = useState('links');
  const [detailFor, setDetailFor] = useState(null);
  const [detail, setDetail] = useState(null);

  async function openDetail(l) {
    setDetailFor(l); setDetail(null);
    try { setDetail(await api.bitlyLink(l.id)); } catch (e) { toastErr(e.message); }
  }

  if (loading && !data) return <div style={{ ...card, padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading your Bitly account…</div>;
  if (data && data.configured === false) return <div style={{ ...card, padding: 30, color: C.fog, fontSize: 13.5, lineHeight: 1.6 }}>Bitly isn’t connected. Add a <span className="mono" style={{ color: C.white }}>BITLY_TOKEN</span> in the project settings to pull your account in here.</div>;
  if (data && data.error) return <div style={{ ...card, padding: 30, color: '#FFB020', fontSize: 13.5 }}>Couldn’t reach Bitly: {data.error}</div>;

  const links = (data && data.links) || [];
  const qrCodes = (data && data.qrCodes) || [];
  const filtered = !q ? links : links.filter((l) => `${l.link} ${l.title || ''} ${l.long_url}`.toLowerCase().includes(q.toLowerCase()));
  // QR view: prefer Bitly's dedicated QR codes; fall back to showing every link as a scannable QR.
  const qrItems = (qrCodes.length ? qrCodes.map((q2) => ({ id: q2.link || q2.id, title: q2.title, long_url: q2.long_url })) : links)
    .filter((x) => !q || `${x.id} ${x.title || ''} ${x.long_url || ''}`.toLowerCase().includes(q.toLowerCase()));

  const subBtn = (k, label, n) => (
    <button onClick={() => setSub(k)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: sub === k ? ACCENT_SOFT : C.ink3, color: sub === k ? C.white : C.fog }}>{label} <span style={{ color: C.fog2 }}>{n}</span></button>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 13, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ ...card, padding: '16px 20px', flex: 1, minWidth: 150 }}><div style={{ fontSize: 12, color: C.fog, fontWeight: 600, marginBottom: 8 }}>Bitlinks in account</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>{data ? data.count : 0}</div></div>
        <div style={{ ...card, padding: '16px 20px', flex: 1, minWidth: 150 }}><div style={{ fontSize: 12, color: C.fog, fontWeight: 600, marginBottom: 8 }}>Total Bitly clicks</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 32, lineHeight: 1, color: ACCENT }}>{data ? data.totalClicks : 0}</div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 7 }}>{subBtn('links', 'Links', links.length)}{subBtn('qr', 'QR Codes', qrCodes.length || links.length)}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 260 }}><Search value={q} onChange={setQ} placeholder={sub === 'qr' ? 'Search QR codes…' : 'Search Bitly links…'} /></div>
          <button onClick={onReload} title="Reload from Bitly" style={iconBtn}>↻</button>
        </div>
      </div>

      {sub === 'links' ? (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: bcols, gap: 12, padding: '11px 18px', borderBottom: `1px solid ${C.line}`, background: C.ink3, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.fog2, fontWeight: 600 }}>
            <span>Bitlink</span><span>Destination</span><span style={{ textAlign: 'right' }}>Clicks</span><span style={{ textAlign: 'right' }}>Created</span>
          </div>
          {filtered.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>{links.length === 0 ? 'No Bitlinks found in this account yet.' : 'No links match your search.'}</div>
            : <div>{filtered.map((l) => (
              <div key={l.id} onClick={() => openDetail(l)} style={{ display: 'grid', gridTemplateColumns: bcols, gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.line}`, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.ink3)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ minWidth: 0 }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: ACCENT, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.id}</span>
                  {l.title && <span style={{ fontSize: 11.5, color: C.fog2 }}>{l.title}</span>}
                </div>
                <span className="mono" style={{ fontSize: 11, color: C.fog, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{l.long_url}</span>
                <div style={{ textAlign: 'right', fontFamily: 'Archivo', fontWeight: 800, fontSize: 16, color: l.clicks > 0 ? ACCENT : C.fog2 }}>{l.clicks == null ? '—' : l.clicks}</div>
                <div style={{ textAlign: 'right', fontSize: 11.5, color: C.fog2 }}>{fmtD(l.created_at)}</div>
              </div>
            ))}</div>}
        </div>
      ) : (
        <div>
          {!qrCodes.length && <div style={{ fontSize: 12, color: C.fog2, marginBottom: 12 }}>Showing a scannable QR for every Bitlink in the account. Click any card to open its analytics.</div>}
          {qrItems.length === 0 ? <div style={{ ...card, padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No QR codes to show.</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {qrItems.map((x) => (
                <div key={x.id} onClick={() => openDetail(x)} style={{ ...card, padding: 16, cursor: 'pointer', textAlign: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line2)}>
                  <div style={{ background: C.white, borderRadius: 10, padding: 10, display: 'inline-block', marginBottom: 10 }}><QR value={`https://${x.id}`} size={120} /></div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.id}</div>
                  {x.title && <div style={{ fontSize: 11, color: C.fog2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.title}</div>}
                </div>
              ))}
            </div>}
        </div>
      )}

      {detailFor && (
        <Modal title={detailFor.id} sub={detailFor.long_url || detailFor.title} onClose={() => setDetailFor(null)} width={540}>
          {!detail ? <div style={{ padding: 30, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading analytics…</div>
            : detail.error ? <div style={{ padding: 20, color: '#FFB020', fontSize: 13 }}>{detail.error}</div>
            : <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ background: C.white, borderRadius: 10, padding: 10, flexShrink: 0 }}><QR value={detail.bitlyUrl || `https://${detailFor.id}`} size={120} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...card, padding: '13px 16px', background: C.ink3, marginBottom: 10 }}><div style={{ fontSize: 11, color: C.fog2, marginBottom: 4 }}>Total Bitly clicks</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 27, color: ACCENT }}>{detail.total}</div></div>
                  <a href={detail.bitlyUrl || `https://${detailFor.id}`} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none' }}>{detailFor.id} ↗</a>
                </div>
              </div>
              <div style={{ ...statLabel }}>Clicks · last 30 days</div>
              <Spark points={(detail.series || []).map((p) => ({ value: p.clicks }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginTop: 20 }}>
                <div><div style={statLabel}>Country</div><Bars rows={detail.byCountry} /></div>
                <div><div style={statLabel}>Referrer</div><Bars rows={detail.byReferrer} /></div>
              </div>
            </div>}
        </Modal>
      )}
    </div>
  );
}

export default function QrPlatform() {
  const [user, setUser] = useState(undefined);
  const [theme, setTheme] = useState('dark');
  const [tab, setTab] = useState('links');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ longUrl: '', title: '', slug: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [q, setQ] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [statsFor, setStatsFor] = useState(null);
  const [stats, setStats] = useState(null);
  const [bitly, setBitly] = useState(null);
  const [bitlyAcct, setBitlyAcct] = useState(null);
  const [bitlyLoading, setBitlyLoading] = useState(false);
  const [bq, setBq] = useState('');

  useEffect(() => { api.session().then((d) => setUser(d.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { try { const t = localStorage.getItem('cb-theme'); if (t) setTheme(t); } catch {} }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); try { localStorage.setItem('cb-theme', theme); } catch {} }, [theme]);

  const load = useCallback(() => { setLoading(true); api.hub().then((d) => setLinks(d.links)).catch((e) => toastErr(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  const loadBitly = useCallback(() => {
    setBitlyLoading(true);
    api.bitlyAccount().then(setBitlyAcct).catch((e) => toastErr(e.message)).finally(() => setBitlyLoading(false));
  }, []);
  useEffect(() => { if (user && tab === 'bitly' && !bitlyAcct) loadBitly(); }, [user, tab, bitlyAcct, loadBitly]);

  async function create() {
    if (!form.longUrl.trim()) return toastErr('Enter a destination URL');
    setBusy(true);
    try { const r = await api.createHubLink(form); setResult(r); setLinks((ls) => [r, ...ls]); navigator.clipboard?.writeText(r.shortUrl).catch(() => {}); toast('Short link created & copied'); setForm({ longUrl: '', title: '', slug: '' }); }
    catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }
  async function doDelete() {
    if (!confirmDel) return; setBusy(true);
    try { await api.deleteHubLink(confirmDel.id); toast('Link deleted'); setConfirmDel(null); load(); }
    catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }
  async function openStats(l) {
    setStatsFor(l); setStats(null); setBitly(null);
    try { setStats(await api.hubStats(l.id)); } catch (e) { toastErr(e.message); }
    api.bitlyStats(l.id).then(setBitly).catch(() => {});
  }

  const filtered = useMemo(() => !q ? links : links.filter((l) => `${l.slug} ${l.long_url} ${l.title || ''}`.toLowerCase().includes(q.toLowerCase())), [links, q]);
  const totalClicks = useMemo(() => links.reduce((s, l) => s + (l.clicks || 0), 0), [links]);
  const topLinks = useMemo(() => [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 8), [links]);
  const maxTop = Math.max(1, ...topLinks.map((l) => l.clicks || 0));

  if (user === undefined) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.ink, color: C.fog2 }}>Loading…</div>;
  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: C.ink, color: C.white }}>
      <BrandLogo brand={BRANDS.corporate} height={30} />
      <div style={{ color: C.fog, fontSize: 14 }}>Please sign in to Catalyst to use the Link Platform.</div>
      <a href="/" style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>Go to sign in →</a>
    </div>
  );

  const cols = '1.6fr 1.4fr 70px 104px';
  const tabBtn = (k, label) => (
    <button onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === k ? ACCENT_SOFT : 'transparent', color: tab === k ? C.white : C.fog }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.white }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, background: C.ink2, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <BrandLogo brand={BRANDS.corporate} height={24} />
          <div style={{ width: 1, height: 24, background: C.line2 }} />
          <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 16, letterSpacing: '-.02em' }}>Link Platform</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 14 }}>{tabBtn('links', 'Links')}{tabBtn('analytics', 'Analytics')}{tabBtn('bitly', 'Bitly')}</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme" style={iconBtn}>{theme === 'dark' ? '☀' : '☾'}</button>
          <a href="/" style={{ fontSize: 12.5, fontWeight: 600, color: C.fog, textDecoration: 'none' }}>← Back to Catalyst</a>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '26px 24px 60px' }}>
        {/* stat strip */}
        {tab !== 'bitly' && (
        <div style={{ display: 'flex', gap: 13, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ ...card, padding: '16px 20px', flex: 1, minWidth: 150 }}><div style={{ fontSize: 12, color: C.fog, fontWeight: 600, marginBottom: 8 }}>Short links</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>{links.length}</div></div>
          <div style={{ ...card, padding: '16px 20px', flex: 1, minWidth: 150 }}><div style={{ fontSize: 12, color: C.fog, fontWeight: 600, marginBottom: 8 }}>Total clicks</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 32, lineHeight: 1, color: ACCENT }}>{totalClicks}</div></div>
        </div>
        )}

        {tab === 'links' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start', marginBottom: 24 }}>
              <div style={{ ...card, padding: 22 }}>
                <Field label="Destination URL" param="long URL"><input value={form.longUrl} onChange={(e) => setForm({ ...form, longUrl: e.target.value })} placeholder="https://www.clevelandbrothers.com/page" style={inputStyle} /></Field>
                <Field label="Label" hint="Optional."><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Spring rental flyer" style={inputStyle} /></Field>
                <Field label="Custom back-half" hint="Optional — leave blank for a random code.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className="mono" style={{ fontSize: 12.5, color: C.fog2 }}>/s/</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="spring-rental" className="mono" style={inputStyle} /></div>
                </Field>
                <Btn disabled={busy} onClick={create} style={{ width: '100%' }}>{busy ? 'Creating…' : 'Create short link + QR'}</Btn>
              </div>
              <div style={{ ...card, padding: 20, position: 'sticky', top: 80 }}>
                <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.fog2, marginBottom: 14 }}>Result</div>
                {result ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13 }}>
                    <QR value={`${result.shortUrl}?s=qr`} size={166} label={result.slug} />
                    <a href={result.shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 14, fontWeight: 600, color: ACCENT, wordBreak: 'break-all', textAlign: 'center' }}>{result.shortUrl}</a>
                    <button onClick={() => { navigator.clipboard?.writeText(result.shortUrl); toast('Copied'); }} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: C.ink3, border: `1px solid ${C.line2}`, color: C.white }}>Copy short link</button>
                  </div>
                ) : <div style={{ textAlign: 'center', color: C.fog2, fontSize: 13, padding: '30px 0' }}><div style={{ fontSize: 26, marginBottom: 10, opacity: 0.6 }}>🔗</div>Your short link and QR appear here.</div>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>All short links</h3>
              <div style={{ width: 260 }}><Search value={q} onChange={setQ} placeholder="Search short links…" /></div>
            </div>
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '11px 18px', borderBottom: `1px solid ${C.line}`, background: C.ink3, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.fog2, fontWeight: 600 }}>
                <span>Short link</span><span>Destination</span><span style={{ textAlign: 'right' }}>Clicks</span><span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              {loading ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>Loading…</div>
                : filtered.length === 0 ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No short links yet — create one above.</div>
                : <div>
                  {filtered.map((l) => (
                    <div key={l.id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.line}` }}>
                      <div style={{ minWidth: 0 }}>
                        <a href={l.shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 13, fontWeight: 600, color: ACCENT, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>/s/{l.slug}</a>
                        {l.title && <span style={{ fontSize: 11.5, color: C.fog2 }}>{l.title}</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: C.fog, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{l.long_url}</div>
                      <button onClick={() => openStats(l)} style={{ textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Archivo', fontWeight: 800, fontSize: 16, color: l.clicks > 0 ? ACCENT : C.fog2 }}>{l.clicks}</button>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button title="Analytics" onClick={() => openStats(l)} style={iconBtn}>📊</button>
                        <button title="Copy" onClick={() => { navigator.clipboard?.writeText(l.shortUrl); toast('Copied'); }} style={iconBtn}>⧉</button>
                        <details style={{ position: 'relative' }}>
                          <summary style={{ ...iconBtn, listStyle: 'none' }}>▦</summary>
                          <div style={{ position: 'absolute', right: 0, marginTop: 6, zIndex: 30, ...card, padding: 14, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}><QR value={`${l.shortUrl}?s=qr`} size={150} label={l.slug} /></div>
                        </details>
                        {can(user, 'approver') && <button title="Delete" onClick={() => setConfirmDel(l)} style={{ ...iconBtn, color: '#FFB020' }}>🗑</button>}
                      </div>
                    </div>
                  ))}
                </div>}
            </div>
          </>
        ) : tab === 'analytics' ? (
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top links by clicks</h3>
            {topLinks.length === 0 ? <div style={{ color: C.fog2, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No clicks recorded yet.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topLinks.map((l) => (
                  <div key={l.id} onClick={() => openStats(l)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span className="mono" style={{ color: ACCENT }}>/s/{l.slug}<span style={{ color: C.fog2 }}>{l.title ? ` · ${l.title}` : ''}</span></span>
                      <span className="mono" style={{ color: C.white, fontWeight: 600 }}>{l.clicks}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: C.ink3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(l.clicks / maxTop) * 100}%`, borderRadius: 99, background: 'linear-gradient(90deg,#C99700,#FFCD11)' }} /></div>
                  </div>
                ))}
              </div>}
          </div>
        ) : (
          <BitlyAccount data={bitlyAcct} loading={bitlyLoading} q={bq} setQ={setBq} onReload={() => { setBitlyAcct(null); }} />
        )}
      </main>

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
              <Spark points={stats.series} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginTop: 20 }}>
                <div><div style={statLabel}>Device</div><Bars rows={stats.byDevice} /></div>
                <div><div style={statLabel}>Browser</div><Bars rows={stats.byBrowser} /></div>
                <div><div style={statLabel}>Operating system</div><Bars rows={stats.byOs} /></div>
                <div><div style={statLabel}>Country</div><Bars rows={stats.byCountry} /></div>
                <div><div style={statLabel}>City</div><Bars rows={stats.byCity} /></div>
                <div><div style={statLabel}>Referrer</div><Bars rows={stats.byReferrer} /></div>
              </div>
              {bitly && bitly.configured && bitly.linked && !bitly.error && (
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={statLabel}>Bitly tracking</div>
                    {bitly.bitlyUrl && <a href={bitly.bitlyUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: ACCENT, textDecoration: 'none' }}>{bitly.bitlink} ↗</a>}
                  </div>
                  <div style={{ display: 'flex', gap: 11, marginBottom: 16 }}>
                    <div style={{ ...card, padding: '13px 16px', flex: 1, background: C.ink3 }}><div style={{ fontSize: 11, color: C.fog2, marginBottom: 4 }}>Bitly clicks</div><div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 27, color: ACCENT }}>{bitly.total}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px' }}>
                    <div><div style={statLabel}>Country (Bitly)</div><Bars rows={bitly.byCountry} /></div>
                    <div><div style={statLabel}>Referrer (Bitly)</div><Bars rows={bitly.byReferrer} /></div>
                  </div>
                </div>
              )}
            </div>}
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Delete short link" sub="Removes the link and its click history." onClose={() => setConfirmDel(null)} width={420}>
          <p style={{ fontSize: 13.5, color: C.fog, lineHeight: 1.6, marginBottom: 18 }}>Delete <span className="mono" style={{ color: C.white }}>/s/{confirmDel.slug}</span>? Anyone who scans the QR or clicks it afterward will hit a dead link.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={doDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete link'}</Btn>
          </div>
        </Modal>
      )}
      <Toast />
    </div>
  );
}
