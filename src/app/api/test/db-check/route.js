import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Database test error:', testError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    // Get users count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json({
        success: false,
        error: 'Failed to count users',
        details: countError.message
      }, { status: 500 })
    }

    // Get sample users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_approved, created_at')
      .limit(5)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: count,
      sampleUsers: users,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database check failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}