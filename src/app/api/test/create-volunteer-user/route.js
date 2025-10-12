import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const email = 'volunteer@test.com';
    const password = 'password123';
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Volunteer user already exists',
        email: email
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: hashedPassword,
        user_type: 'volunteer',
        is_verified: true,
        is_approved: true
      })
      .select()
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Create volunteer profile
    const { data: profile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .insert({
        user_id: user.id,
        full_name: 'Test Volunteer',
        phone: '1234567890',
        address: 'Test City, Test State',
        skills: 'Testing, Debugging',
        availability: 'weekends',
        experience: 'Testing volunteer applications'
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Test volunteer user created successfully',
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type
      },
      profile: profile,
      credentials: {
        email: email,
        password: password
      }
    });

  } catch (error) {
    console.error('Create volunteer user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}