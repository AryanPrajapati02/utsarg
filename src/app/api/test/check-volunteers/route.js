import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('=== VOLUNTEER DEBUG CHECK ===');
    
    // 1. Check if there are any users with user_type = 'volunteer'
    const { data: volunteerUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type, created_at')
      .eq('user_type', 'volunteer');

    console.log('Volunteer users found:', volunteerUsers?.length || 0);
    console.log('Users error:', usersError);

    // 2. Check if there are any volunteer_profiles
    const { data: volunteerProfiles, error: profilesError } = await supabase
      .from('volunteer_profiles')
      .select('*');

    console.log('Volunteer profiles found:', volunteerProfiles?.length || 0);
    console.log('Profiles error:', profilesError);

    // 3. Check if there are any volunteer_applications
    const { data: volunteerApplications, error: applicationsError } = await supabase
      .from('volunteer_applications')
      .select('*');

    console.log('Volunteer applications found:', volunteerApplications?.length || 0);
    console.log('Applications error:', applicationsError);

    // 4. Try the exact query from the admin API
    const { data: adminQuery, error: adminError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        volunteer_profiles (
          full_name,
          phone,
          address,
          skills,
          availability,
          experience
        ),
        volunteer_applications (
          id,
          status,
          ngo_profiles (
            ngo_name
          )
        )
      `)
      .eq('user_type', 'volunteer');

    console.log('Admin query result:', adminQuery?.length || 0);
    console.log('Admin query error:', adminError);

    return NextResponse.json({
      volunteerUsers: volunteerUsers || [],
      volunteerProfiles: volunteerProfiles || [],
      volunteerApplications: volunteerApplications || [],
      adminQueryResult: adminQuery || [],
      errors: {
        usersError,
        profilesError,
        applicationsError,
        adminError
      }
    });

  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}