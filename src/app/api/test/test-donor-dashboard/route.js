import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    // Get the donor user
    const { data: donorUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
      .single()

    if (userError || !donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }

    // Create a test JWT token for this user
    const token = jwt.sign(
      { 
        userId: donorUser.id, 
        email: donorUser.email, 
        user_type: 'donor' 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )

    // Test the donor dashboard API
    const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/donor/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    let dashboardData = null
    let dashboardError = null

    if (dashboardResponse.ok) {
      dashboardData = await dashboardResponse.json()
    } else {
      dashboardError = await dashboardResponse.text()
    }

    // Also test the donations API
    const donationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/donor/donations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    let donationsData = null
    let donationsError = null

    if (donationsResponse.ok) {
      donationsData = await donationsResponse.json()
    } else {
      donationsError = await donationsResponse.text()
    }

    return NextResponse.json({
      donorUser,
      testToken: token,
      dashboard: {
        success: dashboardResponse.ok,
        status: dashboardResponse.status,
        data: dashboardData,
        error: dashboardError
      },
      donations: {
        success: donationsResponse.ok,
        status: donationsResponse.status,
        data: donationsData,
        error: donationsError
      }
    })

  } catch (error) {
    console.error('Test donor dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}