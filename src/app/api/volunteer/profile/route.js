import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userType = decoded.userType || decoded.user_type;
    if (userType !== 'volunteer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: volunteer, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching volunteer profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // If no profile exists, return empty profile
    const profile = volunteer || {
      full_name: '',
      phone: '',
      address: '',
      skills: '',
      availability: '',
      experience: ''
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userType = decoded.userType || decoded.user_type;
    if (userType !== 'volunteer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, city, state, skills, availability, experience } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const address = city && state ? `${city}, ${state}` : '';

    const { data: volunteer, error } = await supabase
      .from('volunteer_profiles')
      .upsert({
        user_id: decoded.userId,
        full_name: name,
        phone: phone || null,
        address: address || null,
        skills: skills || null,
        availability: availability || null,
        experience: experience || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating volunteer profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: volunteer 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}