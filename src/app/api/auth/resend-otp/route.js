import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // Verify date format is Year-Month-Day
    console.log('=== RESEND OTP DATE FORMAT VERIFICATION ===')
    console.log('Current time:', new Date().toISOString())
    console.log('Current time (Year-Month-Day):', new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'))
    console.log('Resending OTP with expiration (ISO):', otpExpiresAt.toISOString())
    console.log('Resending OTP with expiration (Year-Month-Day):', otpExpiresAt.getFullYear() + '-' + String(otpExpiresAt.getMonth() + 1).padStart(2, '0') + '-' + String(otpExpiresAt.getDate()).padStart(2, '0'))
    console.log('New OTP will be valid for 15 minutes from now')
    console.log('=== END RESEND OTP DATE VERIFICATION ===')

    // Update user with new OTP
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        otp,
        otp_expires_at: otpExpiresAt
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to generate new OTP' },
        { status: 500 }
      )
    }

    // Get profile name for email
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

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, profileName)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'OTP sent successfully'
    })

  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}