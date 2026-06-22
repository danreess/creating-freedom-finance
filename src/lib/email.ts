import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.EMAIL_SMTP_HOST;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  if (!host || !user || !pass) throw new Error("Email not configured");

  const port = parseInt(process.env.EMAIL_SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string
): Promise<void> {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;
  const transporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070d1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1a2e;border-radius:16px;border:1px solid #1e2d4a;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #1e2d4a;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:#10b98126;border-radius:8px;text-align:center;vertical-align:middle;">
              <span style="font-size:18px;line-height:36px;">🛡️</span>
            </td>
            <td style="padding-left:10px;font-size:16px;font-weight:600;color:#ffffff;">Creating Freedom Finance</td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Verify your email</p>
          <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;">Hi ${name}, enter this code to complete your registration.</p>
          <!-- Code box -->
          <div style="background:#0a1222;border:1px solid #1e2d4a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Verification Code</p>
            <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#10b981;font-family:monospace;">${code}</p>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;">⏱️ This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.</p>
          <p style="margin:0;font-size:13px;color:#64748b;">🔒 If you didn't create this account, you can safely ignore this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #1e2d4a;">
          <p style="margin:0;font-size:12px;color:#334155;">This is an automated message from your personal Creating Freedom Finance. Do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Creating Freedom Finance" <${from}>`,
    to,
    subject: `${code} — your Creating Freedom Finance verification code`,
    text: `Hi ${name},\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't create this account, ignore this email.`,
    html,
  });
}
