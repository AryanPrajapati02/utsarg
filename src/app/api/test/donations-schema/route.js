import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Check if donations table exists and get its structure
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Donations table error:', error)
      return NextResponse.json({
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }

    // Try to get table info from information_schema
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'donations' })
      .single()

    return NextResponse.json({
      message: 'Donations table check',
      tableExists: !error,
      sampleData: data,
      tableInfo: tableInfo || 'Could not fetch table info',
      tableError: tableError?.message || null
    })

  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}