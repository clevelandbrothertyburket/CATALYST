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
    <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 200, background: '#fff', color: C.ink, fontWeight: 600, fontSize: 13.5, padding: '11px 20px', borderRadius: 99, boxShadow: '0 12px 40px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: err ? C.red : C.good }} />
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
function Stat({ label, value, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ ...card, padding: '18px 20px', flex: 1, minWidth: 0, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 12, color: C.fog, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 34, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.fog2, marginTop: 7 }}>{sub}</div>}
    </div>
  );
}
function Dashboard({ user, go, data }) {
  const { codes, links, pending } = data;
  const active = codes.filter((c) => c.status === 'active').length;
  const byBU = useMemo(() => {
    const m = {}; codes.forEach((c) => (m[c.business_unit] = (m[c.business_unit] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [codes]);
  const max = Math.max(1, ...byBU.map((b) => b[1]));
  return (
    <div>
      <PageHead title={`Welcome back, ${user.name.split(' ')[0]}`} sub="Your campaign taxonomy at a glance." />
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <Stat label="Campaign codes" value={codes.length} sub={`${active} active`} onClick={() => go('codes')} />
        <Stat label="Pending approval" value={pending.length} sub="In the review queue" onClick={() => go('approvals')} />
        <Stat label="UTM links built" value={links.length} sub="Logged to history" onClick={() => go('links')} />
        <Stat label="Business units" value={new Set(codes.map((c) => c.bu)).size} sub="Across the taxonomy" onClick={() => go('taxonomy')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Codes by business unit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {byBU.map(([name, n]) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: C.fog }}>{name}</span><span className="mono" style={{ color: C.white }}>{n}</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: C.ink3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(n / max) * 100}%`, background: ACCENT, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
  pending: ['active', 'rejected'], active: ['deprecated', 'retired', 'archived'],
  deprecated: ['active', 'retired', 'archived'], retired: ['archived', 'active'],
  rejected: ['pending'], archived: ['active'],
};
function CampaignCodes({ user, data, reload }) {
  const [q, setQ] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showReq, setShowReq] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const isApprover = can(user, 'approver');

  const filtered = useMemo(() => data.codes.filter((c) => {
    if (buFilter && c.bu !== buFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (!q) return true;
    return `${c.code} ${c.camp_name} ${c.business_unit} ${c.initiative} ${c.department}`.toLowerCase().includes(q.toLowerCase());
  }), [data.codes, q, buFilter, statusFilter]);

  async function transition(id, to) {
    setMenuFor(null);
    try { await api.changeStatus(id, to); toast(`Moved to ${to}`); reload(); }
    catch (e) { toastErr(e.message); }
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
          {['active', 'pending', 'deprecated', 'retired', 'archived', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
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
                  {isApprover && (LIFECYCLE[c.status] || []).length > 0 && (
                    <button onClick={() => setMenuFor(menuFor === c.id ? null : c.id)} style={{ background: 'none', border: 'none', color: C.fog, cursor: 'pointer', fontSize: 17, padding: 4 }}>⋯</button>
                  )}
                  {menuFor === c.id && (
                    <div style={{ position: 'absolute', right: 14, top: 42, zIndex: 20, ...card, padding: 6, minWidth: 150, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                      <div style={{ fontSize: 10.5, color: C.fog2, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Move to</div>
                      {LIFECYCLE[c.status].map((to) => (
                        <button key={to} onClick={() => transition(c.id, to)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: C.white, fontSize: 12.5, padding: '8px 8px', borderRadius: 7, cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.ink3)} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                          {to}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {showReq && <RequestCodeModal user={user} taxonomy={data.taxonomy} existing={data.codes} onClose={() => setShowReq(false)} onDone={() => { setShowReq(false); reload(); }} />}
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
          {tabs.map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === k ? ACCENT : 'transparent', color: tab === k ? ACCENT_TEXT : '#fff' }}>{v}</button>)}
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
    try { await api.decide(req.id, decision, note); toast(decision === 'approve' ? 'Approved — code is now active' : decision === 'changes' ? 'Changes requested' : 'Rejected'); onDone(); }
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
function Chip({ children, on, ghost, onClick }) {
  return <button onClick={onClick} style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: on ? 600 : 500, background: on ? ACCENT : C.ink3, color: on ? ACCENT_TEXT : '#fff', border: `1px solid ${on ? ACCENT : C.line2}`, borderStyle: ghost && !on ? 'dashed' : 'solid' }}>{children}</button>;
}
function Seg({ k, v }) { return <span><span style={{ color: ACCENT }}>{k}=</span><span style={{ color: '#fff' }}>{v || '…'}</span><span style={{ color: ACCENT }}>&</span></span>; }
function UtmLinks({ user, data, reload }) {
  const usable = data.codes.filter((c) => c.status === 'active' || c.status === 'deprecated');
  const [codeId, setCodeId] = useState('');
  const [content, setContent] = useState(''); const [cc, setCc] = useState('');
  const [medium, setMedium] = useState(''); const [mc, setMc] = useState('');
  const [title, setTitle] = useState(''); const [url, setUrl] = useState('');
  const [tab, setTab] = useState('build'); const [q, setQ] = useState('');
  const brand = BRANDS.cat;

  const codeRec = usable.find((c) => c.id === codeId);
  const contentVal = content === '__c' ? cc.trim() : content;
  const mediumVal = medium === '__c' ? mc.trim() : medium;
  const campaign = codeRec ? 'clevelandbrothers-' + codeRec.code : '';
  const ready = codeRec && contentVal && mediumVal && title.trim() && url.trim();

  async function create(keep) {
    if (!ready) return;
    try {
      const { url: full } = await api.createLink({ codeId, content: contentVal, medium: mediumVal, title: title.trim(), baseUrl: url.trim() });
      navigator.clipboard?.writeText(full).catch(() => {});
      toast('Link created & copied'); setTitle(''); setUrl('');
      if (!keep) { setContent(''); setCc(''); setMedium(''); setMc(''); }
      reload();
    } catch (e) { toastErr(e.message); }
  }
  const links = useMemo(() => !q ? data.links : data.links.filter((l) => `${l.code} ${l.title} ${l.url} ${l.medium}`.toLowerCase().includes(q.toLowerCase())), [data.links, q]);
  function exportLinks() {
    const head = ['Code', 'Title', 'Content', 'Medium', 'Campaign', 'Base URL', 'Full URL', 'Created By', 'Created'];
    const rows = data.links.map((l) => [l.code, l.title, l.content, l.medium, l.campaign, l.base_url, l.url, l.created_by, l.created_at]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'utm-links.csv'; a.click(); toast(`Exported ${data.links.length} links`);
  }

  const sel = { ...inputStyle };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18, padding: '10px 14px', borderRadius: 11, background: ACCENT_SOFT, border: '1px solid rgba(226,35,26,.3)' }}>
        <BrandLogo brand={brand} height={22} />
        <div style={{ fontSize: 12.5, color: C.fog }}><b style={{ color: '#fff', fontWeight: 600 }}>Cat website mode.</b> Links here point to the Cat site, so this workspace uses Cat Rentals branding.</div>
      </div>
      <PageHead title="UTM links" sub="Build tracked links from an approved campaign code."
        right={<div style={{ display: 'flex', gap: 8, background: C.ink3, padding: 4, borderRadius: 10, border: `1px solid ${C.line2}` }}>
          <button onClick={() => setTab('build')} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === 'build' ? ACCENT : 'transparent', color: tab === 'build' ? ACCENT_TEXT : '#fff' }}>Build</button>
          <button onClick={() => setTab('history')} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === 'history' ? ACCENT : 'transparent', color: tab === 'history' ? ACCENT_TEXT : '#fff' }}>History ({data.links.length})</button>
        </div>} />
      {tab === 'build' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, alignItems: 'start' }}>
          <div style={{ ...card, padding: 22 }}>
            <Field label="Campaign code" param="utm_campaign" hint="Only approved (active/deprecated) codes appear here.">
              <select value={codeId} onChange={(e) => setCodeId(e.target.value)} style={sel}>
                <option value="">Select a campaign code…</option>
                {usable.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.camp_name} ({c.business_unit})</option>)}
              </select>
            </Field>
            <Field label="Link type" param="utm_content" hint="What kind of element the link sits on.">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CONTENT_TYPES.map(([k, v]) => <Chip key={k} on={content === k} onClick={() => setContent(k)}>{v}</Chip>)}
                <Chip ghost on={content === '__c'} onClick={() => setContent('__c')}>+ Other</Chip>
              </div>
              {content === '__c' && <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="custom content" className="mono" style={{ ...inputStyle, marginTop: 9 }} />}
            </Field>
            <Field label="Medium" param="utm_medium">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MEDIUMS.map(([k, v]) => <Chip key={k} on={medium === k} onClick={() => setMedium(k)}>{v}</Chip>)}
                <Chip ghost on={medium === '__c'} onClick={() => setMedium('__c')}>+ Other</Chip>
              </div>
              {medium === '__c' && <input value={mc} onChange={(e) => setMc(e.target.value)} placeholder="custom medium" className="mono" style={{ ...inputStyle, marginTop: 9 }} />}
            </Field>
            <Field label="Title" param="utm_term" hint="Describes this specific link."><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. spring-promo-hero" className="mono" style={inputStyle} /></Field>
            <Field label="Destination link" param="base URL"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://rent.cat.com/your-page" style={inputStyle} /></Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 4 }}>
              <Btn disabled={!ready} onClick={() => create(true)}>Create &amp; keep code for next link</Btn>
              <Btn variant="ghost" disabled={!ready} onClick={() => create(false)}>Create one &amp; reset</Btn>
            </div>
          </div>
          <div style={{ ...card, padding: 20, position: 'sticky', top: 0 }}>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.fog2, marginBottom: 12 }}>Preview</div>
            <div className="mono" style={{ fontSize: 12, lineHeight: 1.7, wordBreak: 'break-all', color: C.fog, minHeight: 60 }}>
              {url || contentVal || campaign
                ? <><span style={{ color: '#fff' }}>{url || 'https://your-link'}</span>{(url || '').includes('?') ? '&' : '?'}<Seg k="utm_content" v={contentVal} /><Seg k="utm_medium" v={mediumVal} /><Seg k="utm_campaign" v={campaign} /><Seg k="utm_term" v={title.trim()} /></>
                : <span style={{ color: C.fog2, fontStyle: 'italic', fontFamily: 'Inter' }}>Fill the form to preview the tagged link.</span>}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
            <Search value={q} onChange={setQ} placeholder="Search links by code, title, URL…" />
            <Btn variant="ghost" onClick={exportLinks}>Export CSV</Btn>
          </div>
          <div style={{ ...card, overflow: 'hidden' }}>
            {links.length === 0
              ? <div style={{ padding: 44, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No links yet.</div>
              : <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                {links.map((l) => (
                  <div key={l.id} style={{ padding: '13px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                        <Badge>{l.code}</Badge><span style={{ fontSize: 12.5, color: C.white, fontWeight: 500 }}>{l.title}</span>
                        <span style={{ fontSize: 11, color: C.fog2 }}>· {l.medium} · {l.created_by}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: C.fog, wordBreak: 'break-all', lineHeight: 1.5 }}>{l.url}</div>
                    </div>
                    <Btn variant="subtle" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { navigator.clipboard?.writeText(l.url); toast('Copied'); }}>Copy</Btn>
                  </div>
                ))}
              </div>}
          </div>
        </div>
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
          {tabs.map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, background: tab === k ? ACCENT : 'transparent', color: tab === k ? ACCENT_TEXT : '#fff' }}>{v}</button>)}
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

/* ----------------- LINKS & QR (Bitly) ----------------- */
function LinksQR({ user, data, reload }) {
  const [bitly, setBitly] = useState(null);          // {connected, account?}
  const [shortLinks, setShortLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // builder state
  const [source, setSource] = useState('manual');    // 'manual' | 'utm'
  const [utmId, setUtmId] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);        // the freshly created short link
  const [q, setQ] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [status, list] = await Promise.all([api.bitlyStatus().catch(() => ({ connected: false })), api.shortLinks()]);
      setBitly(status);
      setShortLinks(list.shortLinks);
    } catch (e) { toastErr(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const utmLink = data.links.find((l) => l.id === utmId);
  const longUrl = source === 'utm' ? (utmLink?.url || '') : manualUrl.trim();
  const ready = longUrl && (bitly?.connected) && !busy;

  async function generate() {
    if (!ready) return;
    setBusy(true);
    try {
      const r = await api.createShortLink({
        longUrl,
        title: title.trim() || (utmLink ? `${utmLink.code} · ${utmLink.title}` : undefined),
        linkId: source === 'utm' ? utmId : undefined,
      });
      setResult(r);
      navigator.clipboard?.writeText(r.shortUrl).catch(() => {});
      toast('Short link created & copied');
      setTitle('');
      if (source === 'manual') setManualUrl('');
      refresh();
    } catch (e) { toastErr(e.message); } finally { setBusy(false); }
  }

  const filtered = useMemo(() => !q ? shortLinks
    : shortLinks.filter((s) => `${s.short_url} ${s.long_url} ${s.title || ''}`.toLowerCase().includes(q.toLowerCase())), [shortLinks, q]);

  const sel = { ...inputStyle };
  return (
    <div>
      <PageHead title="Links & QR" sub="Shorten any tracked link with Bitly and generate a QR code for print, email, or events." />

      {/* Bitly connection banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18, padding: '11px 15px', borderRadius: 11,
        background: bitly?.connected ? 'rgba(52,199,89,.1)' : 'rgba(255,176,32,.1)',
        border: `1px solid ${bitly?.connected ? 'rgba(52,199,89,.3)' : 'rgba(255,176,32,.35)'}` }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: bitly?.connected ? C.good : C.warn }} />
        <div style={{ fontSize: 12.5, color: C.fog }}>
          {loading ? 'Checking Bitly connection…'
            : bitly?.connected
              ? <><b style={{ color: '#fff', fontWeight: 600 }}>Bitly connected.</b>{bitly.account ? ` Account: ${bitly.account.login}.` : ''} The whole team shortens through this one account.</>
              : <><b style={{ color: '#fff', fontWeight: 600 }}>Bitly not connected.</b> An admin needs to set <span className="mono" style={{ color: C.warn }}>BITLY_TOKEN</span> in the server environment.</>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>
        {/* builder */}
        <div style={{ ...card, padding: 22 }}>
          <Field label="What are you shortening?">
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant={source === 'utm' ? 'primary' : 'subtle'} style={{ flex: 1, fontSize: 12.5, padding: 9 }} onClick={() => setSource('utm')}>A tracked UTM link</Btn>
              <Btn variant={source === 'manual' ? 'primary' : 'subtle'} style={{ flex: 1, fontSize: 12.5, padding: 9 }} onClick={() => setSource('manual')}>Any URL</Btn>
            </div>
          </Field>

          {source === 'utm' ? (
            <Field label="Tracked link" hint="Pick from links built in UTM links.">
              <select value={utmId} onChange={(e) => setUtmId(e.target.value)} style={sel}>
                <option value="">Select a tracked link…</option>
                {data.links.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.title}</option>)}
              </select>
              {utmLink && <div className="mono" style={{ marginTop: 9, fontSize: 11, color: C.fog, wordBreak: 'break-all', lineHeight: 1.5 }}>{utmLink.url}</div>}
            </Field>
          ) : (
            <Field label="URL to shorten" param="long URL">
              <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://rent.cat.com/page?utm_…" style={inputStyle} />
            </Field>
          )}

          <Field label="Label (optional)" hint="Helps you find this short link later.">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spring expo booth banner" style={inputStyle} />
          </Field>

          <Btn disabled={!ready} onClick={generate} style={{ width: '100%' }}>
            {busy ? 'Creating…' : 'Create short link + QR'}
          </Btn>
          {!bitly?.connected && !loading && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.fog2 }}>Connect Bitly to enable generation.</div>
          )}
        </div>

        {/* result / QR panel */}
        <div style={{ ...card, padding: 20, position: 'sticky', top: 0 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.fog2, marginBottom: 14 }}>Result</div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <QR value={result.shortUrl} size={170} label={result.bitlyId?.replace('bit.ly/', '') || 'code'} />
              <div style={{ width: '100%', textAlign: 'center' }}>
                <a href={result.shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 14, fontWeight: 600, color: ACCENT, wordBreak: 'break-all' }}>{result.shortUrl}</a>
                <button onClick={() => { navigator.clipboard?.writeText(result.shortUrl); toast('Copied'); }} style={{ display: 'block', margin: '10px auto 0', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: C.ink3, border: `1px solid ${C.line2}`, color: C.white }}>Copy short link</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: C.fog2, fontSize: 13, padding: '30px 0' }}>
              <div style={{ fontSize: 26, marginBottom: 10, opacity: 0.6 }}>▦</div>
              Your short link and QR code appear here.
            </div>
          )}
        </div>
      </div>

      {/* history */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontFamily: 'Archivo', fontWeight: 700, fontSize: 15 }}>Generated short links</h3>
          <div style={{ width: 280 }}><Search value={q} onChange={setQ} placeholder="Search short links…" /></div>
        </div>
        <div style={{ ...card, overflow: 'hidden' }}>
          {filtered.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: C.fog2, fontSize: 13 }}>No short links yet.</div>
            : <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {filtered.map((s) => (
                <div key={s.id} style={{ padding: '13px 18px', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <a href={s.short_url} target="_blank" rel="noreferrer" className="mono" style={{ fontWeight: 600, fontSize: 13, color: ACCENT }}>{s.short_url}</a>
                      {s.title && <span style={{ fontSize: 12, color: C.white }}>{s.title}</span>}
                      <span style={{ fontSize: 11, color: C.fog2 }}>· {s.created_by}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: C.fog, wordBreak: 'break-all' }}>{s.long_url}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard?.writeText(s.short_url); toast('Copied'); }} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: C.ink3, border: `1px solid ${C.line2}`, color: C.white, flexShrink: 0 }}>Copy</button>
                  <details style={{ flexShrink: 0 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.fog, listStyle: 'none' }}>QR</summary>
                    <div style={{ position: 'absolute', marginTop: 8, marginLeft: -150, zIndex: 30, ...card, padding: 14, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                      <QR value={s.short_url} size={150} label={(s.bitly_id || '').replace('bit.ly/', '') || 'code'} />
                    </div>
                  </details>
                </div>
              ))}
            </div>}
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
      await api.createUser(form);
      toast(`Invited ${form.name}`);
      setForm({ name: '', email: '', role: 'user', password: '' });
      setShow(false);
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
              <span style={{ fontSize: 11, color: C.fog2, flexShrink: 0, width: 110, textAlign: 'right' }}>{fmtDate(u.created_at)}</span>
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
          <Field label="Temporary password" hint="At least 8 characters. Share it securely; they can be reset later.">
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set an initial password" className="mono" style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <Btn variant="ghost" onClick={() => setShow(false)}>Cancel</Btn>
            <Btn onClick={invite} disabled={busy}>{busy ? 'Inviting…' : 'Invite user'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------- APP SHELL ----------------- */
const NAV = [
  ['dashboard', 'Dashboard', '◧', 'viewer'],
  ['codes', 'Campaign codes', '⬢', 'viewer'],
  ['approvals', 'Approvals', '✓', 'user'],
  ['links', 'UTM links', '⛓', 'user'],
  ['linksqr', 'Links & QR', '▦', 'user'],
  ['taxonomy', 'Taxonomy', '⊞', 'viewer'],
  ['audit', 'Audit log', '◷', 'approver'],
  ['users', 'Users', '👤', 'admin'],
];
export default function Portal() {
  const [user, setUser] = useState(undefined); // undefined=loading, null=signed out
  const [view, setView] = useState('dashboard');
  const [data, setData] = useState({ codes: [], links: [], requests: [], pending: [], taxonomy: { departments: {}, businessUnits: {}, initiatives: {}, campaigns: {} } });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.session().then((d) => setUser(d.user)).catch(() => setUser(null)); }, []);

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

  const brand = view === 'links' ? BRANDS.cat : BRANDS.corporate;
  const themeVars = { '--accent': brand.accent, '--accent-text': brand.accentText, '--accent-soft': brand.accentSoft, height: '100%', display: 'flex', transition: 'background .4s ease' };
  const props = { user, data, reload, go: setView };

  async function signOut() { await api.signout().catch(() => {}); setUser(null); }

  return (
    <div style={themeVars}>
      <aside style={{ width: 236, flexShrink: 0, background: C.ink2, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', padding: '18px 14px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 8px 18px' }}><BrandLogo brand={BRANDS.corporate} height={26} /></div>
        <div style={{ fontSize: 10.5, color: C.fog2, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, padding: '0 8px 10px' }}>{APP_NAME}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {NAV.filter(([, , , min]) => can(user, min)).map(([k, label, icon, , ]) => {
            const on = view === k; const locked = k === 'taxonomy' && !can(user, 'admin');
            const badge = k === 'approvals' && data.pending.length > 0 ? data.pending.length : null;
            return (
              <button key={k} onClick={() => setView(k)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', background: on ? ACCENT_SOFT : 'transparent', color: on ? '#fff' : C.fog, fontWeight: on ? 600 : 500, fontSize: 13.5 }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = C.ink3; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: 18, textAlign: 'center', color: on ? ACCENT : C.fog2, fontSize: 14 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {badge && <span style={{ fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, background: C.warn, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>}
                {k === 'links' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.red, boxShadow: on ? 'none' : '0 0 0 3px rgba(226,35,26,.18)' }} title="Cat website linking" />}
                {locked && <span style={{ fontSize: 11, color: C.fog2 }}>🔒</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: ACCENT, color: ACCENT_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{user.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</span>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10.5, color: C.fog2, textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
          <button onClick={signOut} style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 8, background: 'transparent', border: `1px solid ${C.line2}`, color: C.fog, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 32px', position: 'relative' }}>
        {view === 'links' && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(900px 560px at 88% -12%, ${brand.glowA}, transparent 58%), radial-gradient(700px 480px at 0% 110%, ${brand.glowB}, transparent 55%)` }} />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {view === 'dashboard' && <Dashboard {...props} />}
          {view === 'codes' && <CampaignCodes {...props} />}
          {view === 'approvals' && <Approvals {...props} />}
          {view === 'links' && <UtmLinks {...props} />}
          {view === 'linksqr' && <LinksQR {...props} />}
          {view === 'taxonomy' && <Taxonomy {...props} />}
          {view === 'audit' && <AuditLog {...props} />}
          {view === 'users' && <Users {...props} />}
        </div>
      </main>
      <ToastHost />
    </div>
  );
}
