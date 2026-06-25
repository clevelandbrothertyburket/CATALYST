// Transactional email via a Zapier Catch Hook. The app POSTs the invite as JSON
// to your Zap, which sends the email from your real Outlook/Gmail mailbox — no
// domain verification, no DMARC issues.
//
// Set in Vercel:
//   ZAPIER_EMAIL_WEBHOOK_URL = https://hooks.zapier.com/hooks/catch/.../.../
//   APP_URL (optional)       = portal base URL used in the sign-in link
//                              (falls back to the request origin)

export function emailConfigured() {
  return Boolean(process.env.ZAPIER_EMAIL_WEBHOOK_URL);
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ROLE_LABEL = { viewer: 'Viewer', user: 'User', approver: 'Approver', admin: 'Administrator' };

// Branded HTML invite (Cleveland Brothers yellow / black / white). Sent in the
// `html` field of the webhook payload so the Zap can use it directly.
export function inviteEmailHtml({ name, role, email, tempPassword, loginUrl, invitedBy }) {
  const firstName = esc((name || '').split(' ')[0] || 'there');
  const roleLabel = esc(ROLE_LABEL[role] || role);
  const e = { email: esc(email), pw: esc(tempPassword), by: esc(invitedBy), url: esc(loginUrl) };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Catalyst account is ready — sign in with the credentials inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#0a0a0b;padding:24px 30px;">
          <img src="https://www.clevelandbrothers.com/hubfs/branding/cb-logo-header.svg" alt="Cleveland Brothers" height="28" style="display:block;height:28px;width:auto;max-width:240px;border:0;outline:none;text-decoration:none;margin-bottom:12px;">
          <div style="font-family:'Roboto Condensed','Arial Narrow',Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1.5px;line-height:1;text-transform:uppercase;">Catalyst</div>
        </td></tr>
        <tr><td style="padding:32px 30px 6px;">
          <h1 style="margin:0 0 14px;font-family:'Roboto Condensed','Arial Narrow',Arial,sans-serif;font-size:25px;line-height:1.2;color:#0a0a0b;font-weight:700;letter-spacing:.3px;">You've been invited to Catalyst</h1>
          <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.62;color:#3f3f46;">Hi ${firstName}, ${e.by} added you to <b>Catalyst</b> — the Cleveland Brothers campaign code &amp; UTM link portal — as <b>${roleLabel}</b>. Use the credentials below to sign in.</p>
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
              <a href="${e.url}" style="display:inline-block;padding:13px 30px;font-family:'Roboto Condensed','Arial Narrow',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:.4px;color:#0a0a0b;text-decoration:none;border-radius:10px;text-transform:uppercase;">Sign in to Catalyst &rarr;</a>
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

// Send the invite by POSTing JSON to the Zapier catch hook.
export async function sendInviteEmail({ to, name, role, tempPassword, loginUrl, invitedBy }) {
  const url = process.env.ZAPIER_EMAIL_WEBHOOK_URL;
  if (!url) throw new Error('Email is not configured (ZAPIER_EMAIL_WEBHOOK_URL is missing).');

  const subject = "You've been invited to Catalyst";
  const html = inviteEmailHtml({ name, role, email: to, tempPassword, loginUrl, invitedBy });
  const payload = {
    to, subject, html,
    name, email: to, role, roleLabel: ROLE_LABEL[role] || role,
    tempPassword, loginUrl, invitedBy,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Zapier webhook failed (${res.status})${t ? ': ' + t.slice(0, 200) : ''}`);
  }
  return { id: 'zapier' };
}
