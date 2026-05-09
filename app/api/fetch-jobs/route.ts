import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { fetchAllJobs } from '@/lib/fetchJobs';
import { sendDigestEmail } from '@/lib/sendEmail';
import type { UserPreferences, Job } from '@/lib/types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const results: Array<{ user_id: string; jobs_added: number; email_sent: boolean }> = [];

  try {
    // Get all users' preferences
    const { data: allPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*');

    if (prefsError || !allPrefs) {
      return NextResponse.json({ error: 'Failed to fetch preferences', details: prefsError?.message }, { status: 500 });
    }

    for (const prefs of allPrefs as UserPreferences[]) {
      if (!prefs.keywords || prefs.keywords.length === 0) continue;

      try {
        // Fetch jobs for this user's keywords
        const rawJobs = await fetchAllJobs(prefs.keywords, prefs.location || 'Remote');

        // Get existing job URLs for this user
        const { data: existingJobs } = await supabase
          .from('jobs')
          .select('job_url')
          .eq('user_id', prefs.user_id);

        const existingUrls = new Set((existingJobs || []).map((j: { job_url: string }) => j.job_url));

        // Filter out duplicates
        const newJobs = rawJobs.filter((j) => !existingUrls.has(j.job_url));

        // Insert new jobs
        if (newJobs.length > 0) {
          const insertData = newJobs.map((j) => ({
            user_id: prefs.user_id,
            title: j.title,
            company: j.company,
            location: j.location,
            source: j.source,
            job_url: j.job_url,
            description: j.description,
            status: 'new',
          }));

          await supabase.from('jobs').insert(insertData);
        }

        // Send email digest if enabled
        let emailSent = false;
        if (prefs.email_digest_enabled && prefs.email && newJobs.length > 0) {
          // Get the inserted jobs for the email
          const { data: insertedJobs } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', prefs.user_id)
            .eq('status', 'new')
            .order('date_found', { ascending: false })
            .limit(20);

          const result = await sendDigestEmail(
            (insertedJobs as Job[]) || [],
            prefs.email
          );

          // Log email
          await supabase.from('email_logs').insert({
            user_id: prefs.user_id,
            status: result.success ? 'success' : 'failed',
            jobs_count: newJobs.length,
            error_message: result.error || null,
          });

          emailSent = result.success;
          await sleep(2000); // 2s delay between users
        }

        results.push({
          user_id: prefs.user_id,
          jobs_added: newJobs.length,
          email_sent: emailSent,
        });
      } catch (err) {
        console.error(`Error processing user ${prefs.user_id}:`, err);
        results.push({ user_id: prefs.user_id, jobs_added: 0, email_sent: false });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('Fetch jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for manual testing
export async function GET(req: NextRequest) {
  return POST(req);
}
