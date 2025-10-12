import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password required',
        hint: 'Use volunteer@test.com / password123 if you created the test user'
      }, { status: 400 });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'User not found',
        hint: 'Create a test volunteer user first using /api/test/create-volunteer-user'
      }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Check if user is volunteer
    if (user.user_type !== 'volunteer') {
      return NextResponse.json({ 
        error: 'User is not a volunteer',
        userType: user.user_type
      }, { status: 403 });
    }

    // Generate new JWT token with both fields
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        user_type: user.user_type,
        userType: user.user_type,
        isVerified: user.is_verified,
        isApproved: user.is_approved
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Volunteer login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
        isApproved: user.is_approved
      },
      instructions: 'Use this token in Authorization header as "Bearer <token>"'
    });

  } catch (error) {
    console.error('Volunteer login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}