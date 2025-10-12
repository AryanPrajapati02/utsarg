import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Checking users in database...')
    
    // Get all users (limit to first 10 for safety)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, user_type, is_verified, is_approved, created_at')
      .limit(10)
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Found users:', users?.length || 0)
    
    // Check specifically for demo users
    const demoEmails = [
      'admin@ngoplatform.com',
      'ngo@example.com',
      'donor@example.com',
      'volunteer@example.com'
    ]
    
    const demoUsers = []
    for (const email of demoEmails) {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, user_type, is_verified, is_approved')
        .eq('email', email)
        .single()
      
      if (user) {
        demoUsers.push(user)
      }
    }
    
    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
        isApproved: user.is_approved,
        createdAt: user.created_at
      })) || [],
      demoUsers: demoUsers.map(user => ({
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
        isApproved: user.is_approved
      })),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Check users failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}