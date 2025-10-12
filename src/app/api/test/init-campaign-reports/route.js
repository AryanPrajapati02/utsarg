import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Try to select from the table to check if it exists
    const { error: selectError } = await supabaseAdmin
      .from('campaign_reports')
      .select('id')
      .limit(1)

    if (!selectError) {
      return NextResponse.json({ 
        message: 'Campaign reports table already exists',
        success: true 
      })
    }

    // If table doesn't exist, we'll get an error, so let's try to create it
    // Since we can't execute raw SQL directly, let's try using the admin client
    // to create a dummy record which will fail but might create the table structure
    
    return NextResponse.json({ 
      message: 'Please run the SQL migration manually using the add-campaign-reports.sql file',
      success: false,
      instructions: 'Execute the SQL in add-campaign-reports.sql in your Supabase dashboard'
    })

  } catch (error) {
    console.error('Init campaign reports error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      instructions: 'Please run the SQL migration manually using the add-campaign-reports.sql file'
    }, { status: 500 })
  }
}