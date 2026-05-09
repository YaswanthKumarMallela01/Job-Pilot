import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendDigestEmail } from '@/lib/sendEmail';
import type { Job } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return NextResponse.json({ error: 'user_id and email are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch recent new jobs for this user
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'new')
      .order('date_found', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No new jobs to send' });
    }

    const result = await sendDigestEmail(jobs as Job[], email);

    // Log the email attempt
    await supabase.from('email_logs').insert({
      user_id,
      status: result.success ? 'success' : 'failed',
      jobs_count: jobs.length,
      error_message: result.error || null,
    });

    if (result.success) {
      return NextResponse.json({ message: 'Email sent successfully', count: jobs.length });
    } else {
      return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
