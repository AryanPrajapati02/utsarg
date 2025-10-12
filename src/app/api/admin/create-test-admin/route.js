import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const { adminEmail, adminPassword } = await request.json()

    // Default test admin credentials if not provided
    const email = adminEmail || 'admin@utsarg.com'
    const password = adminPassword || 'admin123'

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        user_type: 'super_admin',
        is_verified: true,
        is_approved: true,
        otp: null,
        otp_expires_at: null
      })
      .select()
      .single()

    if (adminError) {
      console.error('Error creating admin user:', adminError)
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Test admin created successfully',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        userType: adminUser.user_type
      },
      credentials: {
        email,
        password,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/login`
      }
    })

  } catch (error) {
    console.error('Create test admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}