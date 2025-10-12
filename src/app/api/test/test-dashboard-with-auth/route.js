import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'

export async function GET() {
  try {
    // Get the authenticated donor user
    const { data: donorUser } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'donor')
      .single()
    
    if (!donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }
    
    console.log('Found donor user:', donorUser)
    
    // Create a token for this user
    const token = generateToken({
      userId: donorUser.id,
      email: donorUser.email,
      user_type: donorUser.user_type
    })
    
    console.log('Generated token for user:', donorUser.id)
    
    // Now call the dashboard API with this token
    const dashboardResponse = await fetch('http://localhost:3000/api/donor/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const dashboardData = await dashboardResponse.json()
    
    console.log('Dashboard response status:', dashboardResponse.status)
    console.log('Dashboard data:', dashboardData)
    
    return NextResponse.json({
      user: donorUser,
      token: token.substring(0, 20) + '...', // Show partial token for debugging
      dashboardStatus: dashboardResponse.status,
      dashboardData
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 })
  }
}