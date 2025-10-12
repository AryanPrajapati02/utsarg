import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()
    console.log('🔐 Password reset request received for email:', email)

    if (!email) {
      console.log('❌ Password reset request failed: No email provided')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      // Don't reveal if email exists or not for security
      console.log('⚠️ Password reset request for non-existent email (security response):', email)
      return NextResponse.json(
        { message: 'If an account with that email exists, we have sent a password reset link.' },
        { status: 200 }
      )
    }

    console.log('✅ User found for password reset:', {
      userId: user.id,
      email: user.email,
      name: user.name
    })

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error storing reset token:', {
        error: updateError.message,
        userId: user.id,
        email: user.email
      })
      return NextResponse.json(
        { error: 'Failed to process password reset request' },
        { status: 500 }
      )
    }

    console.log('✅ Reset token stored successfully for user:', {
      userId: user.id,
      email: user.email,
      tokenExpiry: resetTokenExpiry.toISOString()
    })

    // Send password reset email
    try {
      console.log('🔄 Attempting to send password reset email to:', user.email)
      const emailResult = await sendPasswordResetEmail(user.email, user.name, resetToken)
      console.log('✅ Password reset email process completed for user:', {
        userId: user.id,
        email: user.email,
        emailMessageId: emailResult.messageId,
        resetTokenPrefix: resetToken.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      })
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', {
        error: emailError.message,
        email: user.email,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}