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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job-pilot-three.vercel.app';

  const jobRows = jobs
    .map(
      (job, i) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 14px 16px; color: #6b7280; font-size: 14px;">${i + 1}</td>
      <td style="padding: 14px 16px;">
        <a href="${job.job_url}" style="color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 15px;">${job.title}</a>
        <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">${job.company || 'Unknown'} &mdash; ${job.location || 'N/A'}</div>
      </td>
      <td style="padding: 14px 16px;">
        <span style="background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">${job.source}</span>
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your JobPilot Update — ${date}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px 0; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; color: #111827; font-size: 22px; font-weight: 700;">Your JobPilot Update</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">${date} — ${jobs.length} new job matches found for you</p>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Hi there, here are your latest job matches:
        </p>

        <!-- Jobs Table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f9fafb; border-radius: 12px; overflow: hidden; margin-bottom: 24px; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px 16px; color: #6b7280; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">#</th>
              <th style="padding: 12px 16px; color: #6b7280; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">Job</th>
              <th style="padding: 12px 16px; color: #6b7280; font-size: 12px; text-align: left; text-transform: uppercase; letter-spacing: 1px;">Source</th>
            </tr>
          </thead>
          <tbody>
            ${jobRows}
          </tbody>
        </table>

        <!-- CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px;">
          <tr>
            <td style="background: #4f46e5; border-radius: 10px;">
              <a href="${appUrl}/jobs" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">View all jobs on JobPilot</a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 20px 0; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; line-height: 1.6;">
              You're receiving this because you enabled job alerts on <a href="${appUrl}" style="color: #4f46e5; text-decoration: none;">JobPilot</a>.<br/>
              To stop these emails, visit <a href="${appUrl}/settings" style="color: #4f46e5; text-decoration: none;">Settings</a> and turn off email digest.<br/>
              <br/>
              JobPilot — ${appUrl}
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job-pilot-three.vercel.app';

  const jobList = jobs
    .map(
      (job, i) =>
        `${i + 1}. ${job.title} at ${job.company || 'Unknown'} — ${job.location || 'N/A'}\n   Source: ${job.source}\n   Apply: ${job.job_url}`
    )
    .join('\n\n');

  return `Your JobPilot Update — ${date}

Hi, here are your latest job matches:

${jobList}

---
View all jobs: ${appUrl}/jobs
To stop these emails, visit ${appUrl}/settings and turn off email digest.`;
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://job-pilot-three.vercel.app';
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
      subject: `${jobs.length} new jobs found for you — ${date}`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'List-Unsubscribe': `<${appUrl}/settings>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
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
