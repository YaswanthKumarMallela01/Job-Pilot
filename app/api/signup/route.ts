import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Create user with admin API (service role key) — auto-confirms the email
    const { data, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email — we'll send our own welcome email
    });

    if (signupError) {
      // Handle duplicate user
      if (signupError.message.includes('already been registered') || signupError.message.includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
      }
      return NextResponse.json({ error: signupError.message }, { status: 400 });
    }

    // Send welcome email via our Gmail SMTP
    let emailSent = false;
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        await transporter.sendMail({
          from: `"JobPilot" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: 'Welcome to JobPilot! Your account is ready 🚀',
          html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <tr><td>
      <div style="padding:24px 0;border-bottom:1px solid #2d2d3d;">
        <h1 style="margin:0;color:#e0e0f0;font-size:22px;">Welcome to JobPilot! 🎉</h1>
      </div>
      <p style="color:#c0c0d0;font-size:15px;line-height:1.6;margin:20px 0;">
        Hi there! Your account has been created successfully.<br/><br/>
        <strong style="color:#e0e0f0;">Your email:</strong> ${email}<br/><br/>
        You can now log in and start discovering jobs from 8 sources including LinkedIn, Unstop, Indeed, and more!
      </p>
      <table cellspacing="0" cellpadding="0" style="margin:24px auto;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;">
            <a href="${appUrl}/login" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Log in to JobPilot</a>
          </td>
        </tr>
      </table>
      <p style="padding:20px 0;border-top:1px solid #2d2d3d;color:#5a5a70;font-size:12px;">
        This email was sent by <a href="${appUrl}" style="color:#7c8aff;text-decoration:none;">JobPilot</a>.
      </p>
    </td></tr>
  </table>
</body>
</html>`,
          text: `Welcome to JobPilot!\n\nYour account has been created successfully.\nEmail: ${email}\n\nLog in at: ${appUrl}/login`,
        });
        emailSent = true;
      }
    } catch (emailErr) {
      console.error('Welcome email send error:', emailErr);
      // Don't fail signup if email fails
    }

    return NextResponse.json({
      success: true,
      user_id: data.user?.id,
      email_sent: emailSent,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
