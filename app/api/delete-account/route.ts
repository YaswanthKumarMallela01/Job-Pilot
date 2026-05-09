import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Delete all user data in order (foreign key constraints)
    // 1. Delete email logs
    await supabase.from('email_logs').delete().eq('user_id', user_id);

    // 2. Delete jobs
    await supabase.from('jobs').delete().eq('user_id', user_id);

    // 3. Delete user preferences
    await supabase.from('user_preferences').delete().eq('user_id', user_id);

    // 4. Delete the auth user (requires service role key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Delete user auth error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
