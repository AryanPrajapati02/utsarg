import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test date creation and storage
    const now = new Date()
    const futureDate = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    
    console.log('=== DATE FORMAT TEST ===')
    console.log('Current time:', now.toISOString())
    console.log('Future time:', futureDate.toISOString())
    console.log('Current time (Year-Month-Day):', now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'))
    console.log('Future time (Year-Month-Day):', futureDate.getFullYear() + '-' + String(futureDate.getMonth() + 1).padStart(2, '0') + '-' + String(futureDate.getDate()).padStart(2, '0'))
    
    // Test database interaction
    const testEmail = 'datetest@example.com'
    
    // Clean up any existing test user
    await supabaseAdmin.from('users').delete().eq('email', testEmail)
    
    // Create test user with date
    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: testEmail,
        password_hash: 'test',
        user_type: 'donor',
        otp: '123456',
        otp_expires_at: futureDate,
        is_approved: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to insert test user', details: insertError })
    }
    
    // Retrieve and test date parsing
    const { data: retrievedUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (selectError) {
      console.error('Select error:', selectError)
      return NextResponse.json({ error: 'Failed to retrieve test user', details: selectError })
    }
    
    // Test date parsing
    const parsedDate = new Date(retrievedUser.otp_expires_at)
    const timeDifference = now.getTime() - parsedDate.getTime()
    
    console.log('Retrieved date from DB:', retrievedUser.otp_expires_at)
    console.log('Parsed date:', parsedDate.toISOString())
    console.log('Time difference (ms):', timeDifference)
    console.log('Is valid date?', !isNaN(parsedDate.getTime()))
    console.log('=== END DATE FORMAT TEST ===')
    
    // Clean up test user
    await supabaseAdmin.from('users').delete().eq('email', testEmail)
    
    return NextResponse.json({
      success: true,
      originalDate: futureDate.toISOString(),
      storedDate: retrievedUser.otp_expires_at,
      parsedDate: parsedDate.toISOString(),
      timeDifference: timeDifference,
      isValidDate: !isNaN(parsedDate.getTime()),
      dateFormat: {
        original: futureDate.getFullYear() + '-' + String(futureDate.getMonth() + 1).padStart(2, '0') + '-' + String(futureDate.getDate()).padStart(2, '0'),
        parsed: parsedDate.getFullYear() + '-' + String(parsedDate.getMonth() + 1).padStart(2, '0') + '-' + String(parsedDate.getDate()).padStart(2, '0')
      }
    })
    
  } catch (error) {
    console.error('Date format test error:', error)
    return NextResponse.json({ error: 'Test failed', details: error.message })
  }
}