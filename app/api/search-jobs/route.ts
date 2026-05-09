import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { fetchAllJobs } from '@/lib/fetchJobs';
import { sendDigestEmail } from '@/lib/sendEmail';
import type { UserPreferences, RawJob } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get this user's preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (prefsError || !prefs) {
      return NextResponse.json({
        error: 'No preferences found. Please set up your job preferences in Settings first.',
      }, { status: 404 });
    }

    const userPrefs = prefs as UserPreferences;
    if (!userPrefs.keywords || userPrefs.keywords.length === 0) {
      return NextResponse.json({
        error: 'No keywords configured. Please add job keywords in Settings.',
      }, { status: 400 });
    }

    // Fetch jobs from LinkedIn + Unstop using user's preferences
    const rawJobs = await fetchAllJobs(userPrefs.keywords, userPrefs.location || 'India, Remote', userPrefs.experience_level || 'any');

    // Get existing job URLs for this user to deduplicate
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('job_url')
      .eq('user_id', user_id);

    const existingUrls = new Set((existingJobs || []).map((j: { job_url: string }) => j.job_url));
    const newJobs = rawJobs.filter((j) => !existingUrls.has(j.job_url));

    // Insert new jobs (capped at 50 by fetchAllJobs)
    let insertedCount = 0;
    if (newJobs.length > 0) {
      const insertData = newJobs.map((j) => ({
        user_id,
        title: j.title,
        company: j.company,
        location: j.location,
        source: j.source,
        job_url: j.job_url,
        description: j.description,
        status: 'new',
      }));

      const { error: insertError } = await supabase.from('jobs').insert(insertData);
      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        insertedCount = newJobs.length;
      }
    }

    // Send email digest with all found jobs — ALWAYS send when Search Jobs Now is pressed
    let emailSent = false;
    const recipientEmail = userPrefs.email || process.env.RECIPIENT_EMAIL;
    if (recipientEmail) {
      try {
        const jobsForEmail: RawJob[] = rawJobs.slice(0, 50);
        if (jobsForEmail.length > 0) {
          const result = await sendDigestEmail(recipientEmail, jobsForEmail);
          emailSent = result.success;

          // Log the email
          await supabase.from('email_logs').insert({
            user_id,
            status: result.success ? 'success' : 'failed',
            jobs_count: jobsForEmail.length,
            error_message: result.error || null,
          });
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        await supabase.from('email_logs').insert({
          user_id,
          status: 'failed',
          jobs_count: 0,
          error_message: String(emailErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_found: rawJobs.length,
      new_jobs: insertedCount,
      duplicates_skipped: rawJobs.length - insertedCount,
      sources_checked: 2,
      email_sent: emailSent,
    });
  } catch (err) {
    console.error('Search jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
