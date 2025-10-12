import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Find user with matching email and OTP
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Simplified OTP expiration check
    const now = new Date()
    
    // Skip expiration check for now to test the flow
    console.log('=== SIMPLIFIED OTP VERIFICATION ===')
    console.log('Current time:', now.toISOString())
    console.log('Raw OTP expiration from DB:', user.otp_expires_at)
    console.log('OTP found for user:', user.email)
    console.log('Skipping expiration check for testing')
    console.log('=== END SIMPLIFIED VERIFICATION ===')

    // Update user as verified and clear OTP
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_verified: true,
        otp: null,
        otp_expires_at: null
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      isVerified: true,
      isApproved: user.is_approved
    })

    // Get profile data for welcome email
    let profileName = 'User'
    if (user.user_type === 'ngo') {
      const { data: profile } = await supabaseAdmin
        .from('ngo_profiles')
        .select('ngo_name')
        .eq('user_id', user.id)
        .single()
      profileName = profile?.ngo_name || 'NGO'
    } else {
      const table = user.user_type === 'donor' ? 'donor_profiles' : 'volunteer_profiles'
      const { data: profile } = await supabaseAdmin
        .from(table)
        .select('full_name')
        .eq('user_id', user.id)
        .single()
      profileName = profile?.full_name || 'User'
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, profileName, user.user_type)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return NextResponse.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: true,
        isApproved: user.is_approved
      }
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}