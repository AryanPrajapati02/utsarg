import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('=== FIXING VOLUNTEER DATA ===');
    
    // 1. Find volunteers without profiles
    const { data: volunteersWithoutProfiles, error: findError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        created_at,
        volunteer_profiles (id)
      `)
      .eq('user_type', 'volunteer')
      .is('volunteer_profiles.id', null);

    if (findError) {
      console.error('Error finding volunteers:', findError);
      return NextResponse.json({ error: 'Failed to find volunteers' }, { status: 500 });
    }

    console.log('Volunteers without profiles:', volunteersWithoutProfiles?.length || 0);

    // 2. Create missing profiles
    const fixes = [];
    if (volunteersWithoutProfiles && volunteersWithoutProfiles.length > 0) {
      for (const volunteer of volunteersWithoutProfiles) {
        const { data: profile, error: createError } = await supabaseAdmin
          .from('volunteer_profiles')
          .insert({
            user_id: volunteer.id,
            full_name: `Volunteer ${volunteer.email.split('@')[0]}`, // Default name
            phone: null,
            address: null,
            skills: [],
            availability: {},
            experience: null
          })
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create profile for ${volunteer.email}:`, createError);
          fixes.push({
            email: volunteer.email,
            status: 'failed',
            error: createError.message
          });
        } else {
          console.log(`Created profile for ${volunteer.email}`);
          fixes.push({
            email: volunteer.email,
            status: 'created',
            profileId: profile.id
          });
        }
      }
    }

    // 3. Verify the fix worked
    const { data: allVolunteers, error: verifyError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        created_at,
        volunteer_profiles (
          id,
          full_name,
          phone,
          address,
          skills,
          availability,
          experience
        )
      `)
      .eq('user_type', 'volunteer');

    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
    }

    console.log('Total volunteers after fix:', allVolunteers?.length || 0);
    console.log('Volunteers with profiles:', allVolunteers?.filter(v => v.volunteer_profiles?.length > 0).length || 0);

    return NextResponse.json({
      message: 'Volunteer data fix completed',
      volunteersWithoutProfiles: volunteersWithoutProfiles?.length || 0,
      fixes,
      totalVolunteersAfter: allVolunteers?.length || 0,
      volunteersWithProfilesAfter: allVolunteers?.filter(v => v.volunteer_profiles?.length > 0).length || 0,
      sampleVolunteer: allVolunteers?.[0] || null
    });

  } catch (error) {
    console.error('Fix volunteer data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}