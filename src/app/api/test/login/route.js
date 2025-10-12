import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // For testing, let's create a simple admin login
    if (email === 'admin@utsarg.com' && password === 'admin123') {
      // Generate JWT token for admin
      const token = jwt.sign(
        {
          userId: 'test-admin-id',
          email: 'admin@utsarg.com',
          userType: 'admin',
          isVerified: true,
          isApproved: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        message: 'Login successful',
        token,
        user: {
          id: 'test-admin-id',
          email: 'admin@utsarg.com',
          userType: 'admin',
          role: 'admin',
          isVerified: true,
          isApproved: true
        }
      })
    }

    // For testing, let's create a simple donor login
    if (email === 'donor@test.com' && password === 'donor123') {
      const token = jwt.sign(
        {
          userId: 'test-donor-id',
          email: 'donor@test.com',
          userType: 'donor',
          isVerified: true,
          isApproved: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        message: 'Login successful',
        token,
        user: {
          id: 'test-donor-id',
          email: 'donor@test.com',
          userType: 'donor',
          role: 'donor',
          isVerified: true,
          isApproved: true
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid credentials. Try admin@utsarg.com / admin123 or donor@test.com / donor123' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}