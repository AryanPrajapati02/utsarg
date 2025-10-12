import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    const testUsers = [
      {
        email: 'admin@ngoplatform.com',
        password: 'admin123',
        user_type: 'super_admin',
        is_verified: true,
        is_approved: true
      },
      {
        email: 'ngo@example.com',
        password: 'ngo123',
        user_type: 'ngo',
        is_verified: true,
        is_approved: true
      },
      {
        email: 'donor@example.com',
        password: 'donor123',
        user_type: 'donor',
        is_verified: true,
        is_approved: true
      },
      {
        email: 'volunteer@example.com',
        password: 'volunteer123',
        user_type: 'volunteer',
        is_verified: true,
        is_approved: true
      }
    ]

    const results = []

    for (const userData of testUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        results.push({
          email: userData.email,
          status: 'already_exists',
          id: existingUser.id
        })
        continue
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(userData.password, 10)

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password_hash: passwordHash,
          user_type: userData.user_type,
          is_verified: userData.is_verified,
          is_approved: userData.is_approved,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        results.push({
          email: userData.email,
          status: 'error',
          error: error.message
        })
      } else {
        results.push({
          email: userData.email,
          status: 'created',
          id: newUser.id
        })
      }
    }

    return NextResponse.json({
      message: 'Test users creation completed',
      results
    })

  } catch (error) {
    console.error('Create users error:', error)
    return NextResponse.json({
      error: 'Failed to create test users',
      details: error.message
    }, { status: 500 })
  }
}