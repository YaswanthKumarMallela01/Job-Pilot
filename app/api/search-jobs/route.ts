import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { fetchAllJobs } from '@/lib/fetchJobs';
import type { UserPreferences } from '@/lib/types';

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

    // Fetch jobs from all sources
    const rawJobs = await fetchAllJobs(userPrefs.keywords, userPrefs.location || 'Remote');

    // Get existing job URLs for this user to deduplicate
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('job_url')
      .eq('user_id', user_id);

    const existingUrls = new Set((existingJobs || []).map((j: { job_url: string }) => j.job_url));
    const newJobs = rawJobs.filter((j) => !existingUrls.has(j.job_url));

    // Insert new jobs
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

    return NextResponse.json({
      success: true,
      total_found: rawJobs.length,
      new_jobs: insertedCount,
      duplicates_skipped: rawJobs.length - insertedCount,
      sources_checked: 7,
    });
  } catch (err) {
    console.error('Search jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
