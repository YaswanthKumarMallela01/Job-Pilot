import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const userId = req.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('date_found', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data });
  } catch (err) {
    console.error('GET jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await req.json();

    const { user_id, title, company, location, source, job_url, description } = body;

    if (!user_id || !title || !job_url) {
      return NextResponse.json({ error: 'user_id, title, and job_url are required' }, { status: 400 });
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', user_id)
      .eq('job_url', job_url)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Job already exists', id: existing.id });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({ user_id, title, company, location, source, job_url, description, status: 'new' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (err) {
    console.error('POST jobs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
