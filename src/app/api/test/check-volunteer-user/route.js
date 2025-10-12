import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Check if there are any volunteer users
    const { data: volunteers, error } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_approved')
      .eq('user_type', 'volunteer');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also check volunteer profiles
    const { data: profiles, error: profileError } = await supabase
      .from('volunteer_profiles')
      .select('*');

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Volunteer user check',
      volunteerUsers: volunteers,
      volunteerProfiles: profiles,
      hasVolunteers: volunteers.length > 0,
      hasProfiles: profiles.length > 0
    });

  } catch (error) {
    console.error('Check volunteer user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}