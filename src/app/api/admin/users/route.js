import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    console.log('Admin users API called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded successfully for user:', decoded.userId);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type, email')
      .eq('id', decoded.userId)
      .single();

    if (userError) {
      console.log('User lookup error:', userError);
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    }

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.email, 'Type:', user.user_type);

    if (user.user_type !== 'super_admin' && user.user_type !== 'admin') {
      console.log('Access denied for user type:', user.user_type);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const search = searchParams.get('search');

    let users = [];

    // Get donors with user info
    if (!userType || userType === 'donor') {
      let donorQuery = supabase
        .from('donor_profiles')
        .select(`
          *,
          users!inner(id, email, created_at, is_verified)
        `);
      
      if (search) {
        donorQuery = donorQuery.ilike('full_name', `%${search}%`);
      }

      const { data: donors, error: donorError } = await donorQuery;
      
      if (donorError) {
        console.log('Donor query error:', donorError);
      } else if (donors) {
        console.log('Found donors:', donors.length);
        users.push(...donors.map(donor => ({
          id: donor.id,
          user_id: donor.user_id,
          name: donor.full_name,
          email: donor.users.email,
          phone: donor.phone,
          user_type: 'donor',
          created_at: donor.users.created_at,
          is_verified: donor.users.is_verified,
          city: donor.address ? donor.address.split(',')[0]?.trim() : null,
          state: donor.address ? donor.address.split(',')[1]?.trim() : null
        })));
      }
    }

    // Get volunteers with user info
    if (!userType || userType === 'volunteer') {
      let volunteerQuery = supabase
        .from('volunteer_profiles')
        .select(`
          *,
          users!inner(id, email, created_at, is_verified)
        `);
      
      if (search) {
        volunteerQuery = volunteerQuery.ilike('full_name', `%${search}%`);
      }

      const { data: volunteers, error: volunteerError } = await volunteerQuery;
      
      if (volunteerError) {
        console.log('Volunteer query error:', volunteerError);
      } else if (volunteers) {
        console.log('Found volunteers:', volunteers.length);
        users.push(...volunteers.map(volunteer => ({
          id: volunteer.id,
          user_id: volunteer.user_id,
          name: volunteer.full_name,
          email: volunteer.users.email,
          phone: volunteer.phone,
          user_type: 'volunteer',
          created_at: volunteer.users.created_at,
          is_verified: volunteer.users.is_verified,
          city: volunteer.address ? volunteer.address.split(',')[0]?.trim() : null,
          state: volunteer.address ? volunteer.address.split(',')[1]?.trim() : null
        })));
      }
    }

    // Get NGOs with user info
    if (!userType || userType === 'ngo') {
      let ngoQuery = supabase
        .from('ngo_profiles')
        .select(`
          *,
          users!inner(id, email, created_at, is_verified)
        `);
      
      if (search) {
        ngoQuery = ngoQuery.ilike('ngo_name', `%${search}%`);
      }

      const { data: ngos, error: ngoError } = await ngoQuery;
      
      if (ngoError) {
        console.log('NGO query error:', ngoError);
      } else if (ngos) {
        console.log('Found NGOs:', ngos.length);
        users.push(...ngos.map(ngo => ({
          id: ngo.id,
          user_id: ngo.user_id,
          name: ngo.ngo_name,
          email: ngo.users.email,
          phone: ngo.phone,
          user_type: 'ngo',
          created_at: ngo.users.created_at,
          is_verified: ngo.users.is_verified,
          verification_status: ngo.verification_status,
          city: ngo.registered_district,
          state: ngo.registered_state
        })));
      }
    }

    // Sort users by creation date
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      donors: users.filter(u => u.user_type === 'donor').length,
      volunteers: users.filter(u => u.user_type === 'volunteer').length,
      ngos: users.filter(u => u.user_type === 'ngo').length,
      verifiedNgos: users.filter(u => u.user_type === 'ngo' && u.verification_status === 'approved').length
    };

    console.log('Returning stats:', stats);
    console.log('Total users found:', users.length);

    return NextResponse.json({ users, stats });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}