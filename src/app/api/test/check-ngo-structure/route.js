import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check the structure of ngo_profiles table
    const { data, error } = await supabaseAdmin
      .from('ngo_profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get column names
    const columns = data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
      message: 'NGO profiles table structure',
      columns,
      sampleData: data[0] || null,
      totalRecords: data.length
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}