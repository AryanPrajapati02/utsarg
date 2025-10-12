import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    console.log('Initializing database tables...')
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('ngo', 'donor', 'volunteer', 'super_admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        otp VARCHAR(6),
        otp_expires_at TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `
    
    const { error: usersError } = await supabase.rpc('exec_sql', { 
      sql: createUsersTable 
    })
    
    if (usersError) {
      console.error('Failed to create users table:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create users table',
        details: usersError.message
      }, { status: 500 })
    }
    
    console.log('Users table created/verified')
    
    // Test table access
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Table access test failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Table access failed',
        details: testError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tablesCreated: ['users']
    })
    
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed',
      details: error.message
    }, { status: 500 })
  }
}