import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Debug: Starting forgot password process for:', email)
    
    // Step 1: Check if user exists
    console.log('🔍 Step 1: Looking up user in database...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single()
    
    if (userError) {
      console.log('❌ Database error:', userError)
      return NextResponse.json({
        success: false,
        step: 'user_lookup',
        error: userError.message,
        email
      }, { status: 500 })
    }
    
    if (!user) {
      console.log('⚠️ User not found for email:', email)
      return NextResponse.json({
        success: false,
        step: 'user_lookup',
        message: 'User not found',
        email
      }, { status: 404 })
    }
    
    console.log('✅ Step 1: User found:', { id: user.id, email: user.email })
    
    // Step 2: Generate reset token
    console.log('🔍 Step 2: Generating reset token...')
    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    console.log('✅ Step 2: Reset token generated:', {
      tokenLength: resetToken.length,
      expiry: resetTokenExpiry.toISOString()
    })
    
    // Step 3: Store reset token in database
    console.log('🔍 Step 3: Storing reset token in database...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.log('❌ Database update error:', updateError)
      return NextResponse.json({
        success: false,
        step: 'token_storage',
        error: updateError.message,
        userId: user.id
      }, { status: 500 })
    }
    
    console.log('✅ Step 3: Reset token stored successfully')
    
    // Step 4: Send email
    console.log('🔍 Step 4: Sending password reset email...')
    
    try {
      const emailResult = await sendPasswordResetEmail(user.email, 'Debug User', resetToken)
      console.log('✅ Step 4: Email sent successfully:', {
        messageId: emailResult.messageId,
        response: emailResult.response
      })
      
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully',
        steps: {
          userLookup: 'success',
          tokenGeneration: 'success',
          tokenStorage: 'success',
          emailSending: 'success'
        },
        user: {
          id: user.id,
          email: user.email
        },
        email: {
          messageId: emailResult.messageId,
          to: user.email
        },
        resetToken: resetToken.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      })
      
    } catch (emailError) {
      console.log('❌ Step 4: Email sending failed:', emailError)
      return NextResponse.json({
        success: false,
        step: 'email_sending',
        error: emailError.message,
        code: emailError.code,
        user: {
          id: user.id,
          email: user.email
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
    return NextResponse.json({
      success: false,
      step: 'general_error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Send a POST request with { "email": "admin@ngoplatform.com" } to debug forgot password process',
    example: {
      method: 'POST',
      body: { email: 'admin@ngoplatform.com' }
    }
  })
}