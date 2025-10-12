import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType !== 'admin' && decoded.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const availability = searchParams.get('availability');

    let query = supabase
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
      .eq('user_type', 'volunteer');

    // Apply filters
    if (search) {
      query = query.or(`volunteer_profiles.full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (availability) {
      query = query.eq('volunteer_profiles.availability', availability);
    }

    const { data: volunteers, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching volunteers:', error);
      return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
    }

    // Process volunteers to handle missing profiles
    const processedVolunteers = volunteers?.map(volunteer => {
      const profile = volunteer.volunteer_profiles?.[0];
      return {
        id: volunteer.id,
        email: volunteer.email,
        created_at: volunteer.created_at,
        is_verified: volunteer.is_verified,
        profile: profile || {
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
        hasProfile: !!profile,
        applicationCount: volunteer.volunteer_applications?.length || 0
      };
    }) || [];

    const stats = {
      total: processedVolunteers.length,
      withProfiles: processedVolunteers.filter(v => v.hasProfile).length,
      withoutProfiles: processedVolunteers.filter(v => !v.hasProfile).length,
      verified: processedVolunteers.filter(v => v.is_verified).length,
      withApplications: processedVolunteers.filter(v => v.applicationCount > 0).length
    };

    console.log('Volunteer stats:', stats);

    return NextResponse.json({ 
      volunteers: processedVolunteers,
      stats,
      debug: {
        hasSearch: !!search,
        hasAvailability: !!availability,
        searchTerm: search,
        availabilityFilter: availability
      }
    });

  } catch (error) {
    console.error('Admin volunteers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}