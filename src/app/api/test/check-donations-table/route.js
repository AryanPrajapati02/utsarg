import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Try to insert a test record to see what columns are accepted
    const testData = {
      campaign_id: '00000000-0000-0000-0000-000000000000',
      amount: 1,
      donation_type: 'money',
      donor_name: 'Test',
      donor_email: 'test@test.com',
      donor_phone: '1234567890',
      is_anonymous: false,
      payment_status: 'pending',
      transaction_id: 'TEST123'
    }

    // This will fail but show us which columns don't exist
    const { data, error } = await supabaseAdmin
      .from('donations')
      .insert([testData])
      .select()

    if (error) {
      return NextResponse.json({
        message: 'Expected error - shows which columns exist',
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        testData
      })
    }

    return NextResponse.json({
      message: 'Unexpected success',
      data
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}