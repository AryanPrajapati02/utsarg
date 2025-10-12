import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('=== DEBUGGING VOLUNTEER DATA ===');
    
    // 1. Raw query to see what Supabase returns
    const { data: rawVolunteers, error: rawError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        is_verified,
        volunteer_profiles (
          id,
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
          created_at,
          ngo_profiles (
            ngo_name
          )
        )
      `)
      .eq('user_type', 'volunteer')
      .limit(3);

    console.log('Raw volunteers data:', JSON.stringify(rawVolunteers, null, 2));
    console.log('Raw error:', rawError);

    // 2. Check individual tables
    const { data: users } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'volunteer')
      .limit(5);

    const { data: profiles } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .limit(5);

    const { data: applications } = await supabase
      .from('volunteer_applications')
      .select('*')
      .limit(5);

    console.log('Users count:', users?.length);
    console.log('Profiles count:', profiles?.length);
    console.log('Applications count:', applications?.length);

    // 3. Process like the admin API does
    const processedVolunteers = rawVolunteers?.map(volunteer => ({
      id: volunteer.id,
      email: volunteer.email,
      created_at: volunteer.created_at,
      is_verified: volunteer.is_verified,
      profile: volunteer.volunteer_profiles?.[0] || {
        id: null,
        full_name: `Volunteer ${volunteer.email.split('@')[0]}`,
        phone: null,
        address: null,
        skills: [],
        availability: {},
        experience: null,
        incomplete: true
      },
      applications: volunteer.volunteer_applications || [],
      hasProfile: !!(volunteer.volunteer_profiles?.[0]),
      applicationCount: volunteer.volunteer_applications?.length || 0
    })) || [];

    return NextResponse.json({
      message: 'Debug volunteer data',
      rawVolunteers: rawVolunteers || [],
      processedVolunteers,
      counts: {
        users: users?.length || 0,
        profiles: profiles?.length || 0,
        applications: applications?.length || 0
      },
      sampleData: {
        user: users?.[0],
        profile: profiles?.[0],
        application: applications?.[0]
      },
      error: rawError
    });

  } catch (error) {
    console.error('Debug volunteers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}