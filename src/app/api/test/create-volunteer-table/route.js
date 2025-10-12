import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    console.log('Creating volunteer_applications table...')
    
    // First, let's check if the table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'volunteer_applications')
    
    if (tablesError) {
      console.log('Could not check existing tables, proceeding with creation...')
    }
    
    // Try to create a test record to see if table exists
    const { data: testData, error: testError } = await supabase
      .from('volunteer_applications')
      .select('count')
      .limit(1)
    
    if (testError && testError.code === '42P01') {
      // Table doesn't exist, we need to create it manually
      console.log('Table does not exist, creating manually...')
      
      // Since we can't execute raw SQL directly, let's try to insert a dummy record
      // which will fail but might give us more info
      return NextResponse.json({
        success: false,
        error: 'volunteer_applications table does not exist',
        message: 'Please create the table manually in Supabase dashboard',
        sql: `
          CREATE TABLE volunteer_applications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
            ngo_id UUID REFERENCES ngo_profiles(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(volunteer_id, ngo_id)
          );
        `
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'volunteer_applications table exists and is accessible',
      tableExists: !testError
    })
    
  } catch (error) {
    console.error('Table creation test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Table creation test failed',
      details: error.message
    }, { status: 500 })
  }
}