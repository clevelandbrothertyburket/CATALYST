// Transactional email — provider-agnostic. Works with whichever key is set, so
// you can pick a provider that does NOT require domain verification (Brevo or
// SendGrid both let you send to anyone after verifying a single "from" address).
//
// Pick ONE and set its key + a verified sender address:
//   Brevo     →  BREVO_API_KEY      (free 300/day; verify one sender email)
//   SendGrid  →  SENDGRID_API_KEY   (free 100/day; "Single Sender Verification")
//   Resend    →  RESEND_API_KEY     (needs a verified DOMAIN for real recipients)
//
//   EMAIL_FROM →  "Catalyst <you@clevelandbrothers.com>"  (the verified sender)
//   APP_URL    →  portal base URL (falls back to the request origin)

function provider() {
  if (process.env.ZAPIER_EMAIL_WEBHOOK_URL) return 'zapier';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.RESEND_API_KEY) return 'resend';
  return null;
}

export function emailConfigured() {
  return provider() !== null;
}

function parseFrom() {
  const raw = (process.env.EMAIL_FROM || '').trim();
  const m = raw.match(/^(.*?)\s*<\s*([^>]+)\s*>$/);
  if (m) return { name: (m[1] || 'Catalyst').trim(), email: m[2].trim() };
  if (raw.includes('@')) return { name: 'Catalyst', email: raw };
  return { name: 'Catalyst', email: 'onboarding@resend.dev' }; // Resend test sender only
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ROLE_LABEL = { viewer: 'Viewer', user: 'User', approver: 'Approver', admin: 'Administrator' };

// Branded HTML invite (Cleveland Brothers yellow / black / white).
export function inviteEmailHtml({ name, role, email, tempPassword, loginUrl, invitedBy }) {
  const firstName = esc((name || '').split(' ')[0] || 'there');
  const roleLabel = esc(ROLE_LABEL[role] || role);
  const e = { email: esc(email), pw: esc(tempPassword), by: esc(invitedBy), url: esc(loginUrl) };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Catalyst account is ready — sign in with the credentials inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#0a0a0b;padding:24px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:13px;">
              <div style="width:38px;height:38px;border-radius:9px;background:#FFCD11;text-align:center;line-height:38px;font-size:20px;font-weight:800;color:#0a0a0b;">C</div>
            </td>
            <td style="vertical-align:middle;">
              <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.6px;line-height:1.1;">CATALYST</div>
              <div style="color:#FFCD11;font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-top:2px;">Cleveland Brothers</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 30px 6px;">
          <h1 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#0a0a0b;font-weight:800;">You've been invited to Catalyst</h1>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.62;color:#3f3f46;">Hi ${firstName}, ${e.by} added you to <b>Catalyst</b> — the Cleveland Brothers campaign code &amp; UTM link portal — as <b>${roleLabel}</b>. Use the credentials below to sign in.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;border:1px solid #e4e4e7;border-radius:12px;margin:0 0 22px;">
            <tr><td style="padding:16px 18px;">
              <div style="font-size:10.5px;color:#71717a;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:4px;">Email</div>
              <div style="font-size:14px;color:#0a0a0b;font-weight:700;margin-bottom:15px;font-family:'Courier New',monospace;">${e.email}</div>
              <div style="font-size:10.5px;color:#71717a;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:4px;">Temporary password</div>
              <div style="font-size:14px;color:#0a0a0b;font-weight:700;font-family:'Courier New',monospace;">${e.pw}</div>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr>
            <td style="border-radius:10px;background:#FFCD11;">
              <a href="${e.url}" style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:700;color:#0a0a0b;text-decoration:none;border-radius:10px;">Sign in to Catalyst &rarr;</a>
            </td>
          </tr></table>
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#71717a;">Or paste this link into your browser:</p>
          <p style="margin:0 0 6px;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${e.url}" style="color:#0a0a0b;font-weight:600;">${e.url}</a></p>
        </td></tr>
        <tr><td style="padding:18px 30px 26px;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:11.5px;line-height:1.6;color:#a1a1aa;">Keep this password private and don't share it. If you weren't expecting this invitation, you can safely ignore this email.<br>&copy; Cleveland Brothers &middot; Catalyst</p>
        </td></tr>
      </table>
      <div style="max-width:520px;margin:14px auto 0;font-size:11px;color:#a1a1aa;text-align:center;">This is an automated message from the Catalyst portal.</div>
    </td></tr>
  </table>
</body></html>`;
}

// ---- provider senders ----
// Zapier Catch Hook: POST the email payload (and all raw fields) to a Zap that
// sends via your real Outlook/Gmail — no domain, no DMARC issues.
async function viaZapier({ to, subject, html, fields }) {
  const res = await fetch(process.env.ZAPIER_EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, ...fields }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Zapier webhook failed (${res.status})${t ? ': ' + t.slice(0, 200) : ''}`);
  }
  return { id: 'zapier' };
}

async function viaBrevo({ from, to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: from.name, email: from.email }, to: [{ email: to }], subject, htmlContent: html }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Brevo send failed (${res.status})${t ? ': ' + t.slice(0, 200) : ''}`);
  }
  const data = await res.json().catch(() => ({}));
  return { id: data.messageId };
}

async function viaSendgrid({ from, to, subject, html }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from.email, name: from.name },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`SendGrid send failed (${res.status})${t ? ': ' + t.slice(0, 200) : ''}`);
  }
  return { id: res.headers.get('x-message-id') || 'sent' };
}

async function viaResend({ from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${from.name} <${from.email}>`, to: [to], subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error?.message || `Resend send failed (${res.status})`);
  return { id: data.id };
}

export async function sendInviteEmail({ to, name, role, tempPassword, loginUrl, invitedBy }) {
  const p = provider();
  if (!p) throw new Error('Email is not configured (set ZAPIER_EMAIL_WEBHOOK_URL, BREVO_API_KEY, SENDGRID_API_KEY, or RESEND_API_KEY).');
  const subject = "You've been invited to Catalyst";
  const html = inviteEmailHtml({ name, role, email: to, tempPassword, loginUrl, invitedBy });
  if (p === 'zapier') {
    return viaZapier({ to, subject, html, fields: { name, email: to, role, roleLabel: ROLE_LABEL[role] || role, tempPassword, loginUrl, invitedBy } });
  }
  const from = parseFrom();
  const payload = { from, to, subject, html };
  if (p === 'brevo') return viaBrevo(payload);
  if (p === 'sendgrid') return viaSendgrid(payload);
  return viaResend(payload);
}
