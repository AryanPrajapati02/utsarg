import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Try to get existing donations to see the structure
    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }

    // Also try to get campaigns to see if any exist
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .limit(5)

    return NextResponse.json({
      donations: donations || [],
      donationsCount: donations?.length || 0,
      campaigns: campaigns || [],
      campaignsCount: campaigns?.length || 0,
      message: 'Successfully queried tables'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}