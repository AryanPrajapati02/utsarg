import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Starting forgot password test...')
    
    // Test the forgot password functionality
    const testEmail = 'admin@ngoplatform.com' // Using the demo admin email
    
    console.log('🧪 Testing with email:', testEmail)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    })

    const data = await response.json()

    console.log('🧪 Test completed. Response:', {
      status: response.status,
      data
    })

    return NextResponse.json({
      message: 'Forgot password test completed',
      status: response.status,
      response: data,
      testEmail,
      timestamp: new Date().toISOString(),
      note: 'Check console logs for detailed email sending information'
    })

  } catch (error) {
    console.error('🧪 Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}