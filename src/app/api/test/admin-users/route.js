import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    console.log('Testing admin users API...');
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted:', token ? 'Yes' : 'No');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded:', decoded);
    } catch (jwtError) {
      console.log('JWT error:', jwtError.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type, email')
      .eq('id', decoded.userId)
      .single();

    console.log('User query result:', { user, error: userError });

    if (userError) {
      return NextResponse.json({ error: 'Database error: ' + userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.user_type !== 'super_admin') {
      return NextResponse.json({ 
        error: `Access denied - User type: ${user.user_type}, Required: super_admin` 
      }, { status: 403 });
    }

    // Test basic query
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('id, email, user_type, created_at')
      .limit(5);

    console.log('Test users query:', { testUsers, error: testError });

    return NextResponse.json({ 
      message: 'Admin users API test successful',
      userInfo: user,
      sampleUsers: testUsers
    });

  } catch (error) {
    console.error('Test admin users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}