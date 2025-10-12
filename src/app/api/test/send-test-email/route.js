import { NextResponse } from 'next/server'
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
    
    console.log('🧪 Testing password reset email to:', email)
    
    // Generate a test token
    const testToken = 'test-token-' + Date.now()
    
    // Send test email
    const result = await sendPasswordResetEmail(email, 'Test User', testToken)
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: email,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test email failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Send a POST request with { "email": "your-email@example.com" } to test email sending',
    example: {
      method: 'POST',
      body: { email: 'test@example.com' }
    }
  })
}