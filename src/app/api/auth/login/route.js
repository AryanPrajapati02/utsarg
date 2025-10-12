import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    console.log('Login attempt for email:', email)

    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.log('User lookup error:', userError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('User found:', { id: user.id, email: user.email, user_type: user.user_type })

    // Verify password
    console.log('Verifying password...')
    const isValidPassword = await bcryptjs.compare(password, user.password_hash)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is verified
    if (!user.is_verified) {
      console.log('User not verified:', email)
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 401 }
      )
    }

    // Check if NGO is approved (skip for super_admin)
    if (user.user_type === 'ngo' && !user.is_approved) {
      console.log('NGO not approved:', email)
      return NextResponse.json(
        { error: 'Your NGO registration is pending admin approval' },
        { status: 401 }
      )
    }

    // Generate JWT token
    console.log('Generating JWT token...')
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
    )

    console.log('Login successful for user:', email)
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        role: user.user_type,
        isVerified: user.is_verified,
        isApproved: user.is_approved
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}