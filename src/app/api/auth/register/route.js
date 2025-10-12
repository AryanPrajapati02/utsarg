import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, userType, ...profileData } = body

    // Validate required fields
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, password, and user type are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password and generate OTP
    const hashedPassword = await hashPassword(password)
    const otp = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    
    // Verify date format is Year-Month-Day
    console.log('=== REGISTRATION DATE FORMAT VERIFICATION ===')
    console.log('Current time:', new Date().toISOString())
    console.log('Current time (Year-Month-Day):', new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'))
    console.log('Setting OTP expiration to (ISO):', otpExpiresAt.toISOString())
    console.log('Setting OTP expiration to (Year-Month-Day):', otpExpiresAt.getFullYear() + '-' + String(otpExpiresAt.getMonth() + 1).padStart(2, '0') + '-' + String(otpExpiresAt.getDate()).padStart(2, '0'))
    console.log('OTP will be valid for 15 minutes from now')
    console.log('=== END REGISTRATION DATE VERIFICATION ===')

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        user_type: userType,
        otp,
        otp_expires_at: otpExpiresAt,
        is_approved: userType === 'super_admin' ? true : userType !== 'ngo'
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create profile based on user type
    let profileError = null
    
    if (userType === 'ngo') {
      const { error } = await supabaseAdmin
        .from('ngo_profiles')
        .insert({
          user_id: user.id,
          ngo_name: profileData.ngoName,
          darpan_id: profileData.darpanId,
          npo_type: profileData.npoType,
          registered_state: profileData.registeredState,
          registered_district: profileData.registeredDistrict,
          description: profileData.description || null,
          contact_person: profileData.contactPerson,
          phone: profileData.phone,
          address: profileData.address,
          website: profileData.website
        })
      profileError = error
    } else if (userType === 'donor') {
      const { error } = await supabaseAdmin
        .from('donor_profiles')
        .insert({
          user_id: user.id,
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
          preferred_causes: profileData.preferredCauses || []
        })
      profileError = error
    } else if (userType === 'volunteer') {
      const { error } = await supabaseAdmin
        .from('volunteer_profiles')
        .insert({
          user_id: user.id,
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address,
          skills: profileData.skills || [],
          availability: profileData.availability || {},
          experience: profileData.experience
        })
      profileError = error
    }

    if (profileError) {
      // Clean up user if profile creation failed
      await supabaseAdmin.from('users').delete().eq('id', user.id)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, profileData.fullName || profileData.ngoName || 'User')
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // Don't fail registration if email fails
    }

    // Send admin notification for NGO registration
    if (userType === 'ngo') {
      try {
        const adminSubject = 'New NGO Registration - Verification Required'
        const adminMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New NGO Registration</h2>
            <p>A new NGO has registered on the Utsarg platform and requires verification:</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>NGO Name:</strong> ${profileData.ngoName}</p>
              <p><strong>DARPAN ID:</strong> ${profileData.darpanId}</p>
              <p><strong>NPO Type:</strong> ${profileData.npoType}</p>
              <p><strong>Contact Person:</strong> ${profileData.contactPerson}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${profileData.phone}</p>
              <p><strong>Location:</strong> ${profileData.registeredDistrict}, ${profileData.registeredState}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/dashboard" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review in Admin Dashboard
              </a>
            </div>
            
            <p>Please review and verify this NGO registration to maintain platform quality.</p>
          </div>
        `

        await sendNotificationEmail(process.env.EMAIL_USER, adminSubject, adminMessage)
      } catch (adminEmailError) {
        console.error('Failed to send admin notification:', adminEmailError)
      }
    }

    return NextResponse.json({
      message: 'Registration successful. Please check your email for OTP verification.',
      userId: user.id,
      requiresVerification: true
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}