import nodemailer from 'nodemailer';

// Accept any object with these fields (works for both Job and RawJob)
interface EmailJob {
  title: string;
  company?: string | null;
  location?: string | null;
  source: string;
  job_url: string;
  description?: string | null;
}

// ─── Create Gmail SMTP transporter ──────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// ─── Generate HTML email body ────────────────────────────────
function generateHtmlBody(jobs: EmailJob[], recipientEmail: string, date: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const jobRows = jobs
    .map(
      (job, i) => `
    <tr style="border-bottom: 1px solid #2d2d3d;">
      <td style="padding: 14px 16px; color: #a0a0b8; font-size: 14px;">${i + 1}</td>
      <td style="padding: 14px 16px;">
        <a href="${job.job_url}" style="color: #7c8aff; text-decoration: none; font-weight: 600; font-size: 15px;">${job.title}</a>
        <div style="color: #8888a0; font-size: 13px; margin-top: 4px;">${job.company || 'Unknown'} &mdash; ${job.location || 'N/A'}</div>
      </td>
      <td style="padding: 14px 16px;">
        <span style="background: #1e1e30; color: #a0a0b8; padding: 4px 10px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">${job.source}</span>
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobPilot Daily Digest — ${date}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px 0; border-bottom: 1px solid #2d2d3d;">
              <h1 style="margin: 0; color: #e0e0f0; font-size: 22px; font-weight: 700;">JobPilot Daily Digest</h1>
              <p style="margin: 8px 0 0; color: #8888a0; font-size: 14px;">${date} — ${jobs.length} jobs found across 8 sources</p>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="color: #c0c0d0; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Hi, here are your latest job matches for <strong style="color: #e0e0f0;">${recipientEmail}</strong>:
        </p>

        <!-- Jobs Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #16162a; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <thead>
            <tr style="background: #1e1e36;">
              <th style="padding: 12px 16px; color: #8888a0; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">#</th>
              <th style="padding: 12px 16px; color: #8888a0; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">Job</th>
              <th style="padding: 12px 16px; color: #8888a0; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">Source</th>
            </tr>
          </thead>
          <tbody>
            ${jobRows}
          </tbody>
        </table>

        <!-- CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px;">
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 10px;">
              <a href="${appUrl}/jobs" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View all jobs on JobPilot</a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 20px 0; border-top: 1px solid #2d2d3d; color: #5a5a70; font-size: 12px; line-height: 1.6;">
              You're receiving this because you enabled email digests on <a href="${appUrl}" style="color: #7c8aff; text-decoration: none;">JobPilot</a>.<br/>
              To stop these emails, log in and turn off email digest in <a href="${appUrl}/settings" style="color: #7c8aff; text-decoration: none;">Settings</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Generate plain text email body ──────────────────────────
function generateTextBody(jobs: EmailJob[], recipientEmail: string, date: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const jobList = jobs
    .map(
      (job, i) =>
        `${i + 1}. ${job.title} at ${job.company || 'Unknown'} — ${job.location || 'N/A'}\n   Source: ${job.source}\n   Apply: ${job.job_url}`
    )
    .join('\n\n');

  return `JobPilot Daily Digest — ${date}

Hi, here are your job matches (${recipientEmail}):

${jobList}

---
View all jobs: ${appUrl}/jobs
To stop these emails, log in and turn off email digest in Settings.`;
}

// ─── Send email digest ───────────────────────────────────────
export async function sendDigestEmail(
  recipientEmail: string,
  jobs: EmailJob[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Gmail credentials not configured, skipping email');
      return { success: false, error: 'Gmail not configured' };
    }

    const transporter = createTransporter();
    const date = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const info = await transporter.sendMail({
      from: `"JobPilot" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      replyTo: process.env.GMAIL_USER,
      subject: `Your job digest — ${jobs.length} jobs found — ${date}`,
      headers: {
        'X-Mailer': 'JobPilot/1.0',
        'X-Priority': '3',
        Precedence: 'bulk',
        'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=unsubscribe>`,
      },
      html: generateHtmlBody(jobs, recipientEmail, date),
      text: generateTextBody(jobs, recipientEmail, date),
    });

    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('Email send error:', message);
    return { success: false, error: message };
  }
}
