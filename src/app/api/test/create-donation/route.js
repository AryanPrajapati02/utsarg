import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    // Try to create a minimal donation record
    const testDonation = {
      campaign_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      amount: 100.00,
      donor_name: 'Test Donor',
      donor_email: 'test@example.com',
      donation_type: 'money',
      payment_status: 'pending',
      transaction_id: `TEST_${Date.now()}`
    }

    console.log('Attempting to insert:', testDonation)

    const { data, error } = await supabase
      .from('donations')
      .insert([testDonation])
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        testData: testDonation
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Test donation created successfully',
      data: data
    })

  } catch (error) {
    console.error('Test donation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}