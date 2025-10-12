import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Test database connection
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_approved')
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Database connection successful',
      userCount: users.length,
      users: users,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}