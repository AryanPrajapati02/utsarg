import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('=== Simple Login Test ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email = 'admin@ngoplatform.com', password = 'admin123' } = body
    
    console.log('Testing login for:', email)
    
    // Step 1: Test database connection
    console.log('Step 1: Testing database connection...')
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('Connection failed:', connectionError)
      return NextResponse.json({
        step: 'connection',
        success: false,
        error: connectionError.message
      }, { status: 500 })
    }
    
    console.log('Database connection: OK')
    
    // Step 2: Find user
    console.log('Step 2: Finding user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) {
      console.error('User lookup failed:', userError)
      return NextResponse.json({
        step: 'user_lookup',
        success: false,
        error: userError.message,
        code: userError.code
      }, { status: 500 })
    }
    
    if (!user) {
      console.log('User not found')
      return NextResponse.json({
        step: 'user_lookup',
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      is_verified: user.is_verified,
      has_password_hash: !!user.password_hash
    })
    
    // Step 3: Check password
    console.log('Step 3: Checking password...')
    if (!user.password_hash) {
      console.error('No password hash found for user')
      return NextResponse.json({
        step: 'password_check',
        success: false,
        error: 'No password hash found'
      }, { status: 500 })
    }
    
    const isValidPassword = await bcryptjs.compare(password, user.password_hash)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      return NextResponse.json({
        step: 'password_check',
        success: false,
        error: 'Invalid password'
      }, { status: 401 })
    }
    
    // Step 4: Check verification status
    console.log('Step 4: Checking verification...')
    if (!user.is_verified) {
      return NextResponse.json({
        step: 'verification_check',
        success: false,
        error: 'User not verified'
      }, { status: 401 })
    }
    
    console.log('All checks passed!')
    
    return NextResponse.json({
      success: true,
      message: 'Login test successful',
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        is_verified: user.is_verified,
        is_approved: user.is_approved
      }
    })
    
  } catch (error) {
    console.error('Simple login test error:', error)
    return NextResponse.json({
      step: 'general_error',
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple login test endpoint',
    usage: 'POST with { email, password } or use defaults'
  })
}