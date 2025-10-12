import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    // Verify donor authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('JWT Payload:', payload)

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    console.log('User data:', user)
    console.log('User error:', userError)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if donor profile exists
    const { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
      .eq('user_id', payload.userId)
      .single()

    console.log('Donor profile:', donorProfile)
    console.log('Profile error:', profileError)

    if (!donorProfile) {
      return NextResponse.json({ 
        error: 'Donor profile not found',
        debug: {
          userId: payload.userId,
          userExists: !!user,
          profileError: profileError?.message
        }
      }, { status: 404 })
    }

    // Check donations
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('donor_id', donorProfile.id)

    console.log('Donations:', donations)
    console.log('Donations error:', donationsError)

    // Check campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .limit(5)

    console.log('Sample campaigns:', campaigns)

    return NextResponse.json({
      debug: {
        jwt: {
          userId: payload.userId,
          userType: payload.userType
        },
        user: user,
        donorProfile: donorProfile,
        donations: {
          count: donations?.length || 0,
          data: donations,
          error: donationsError?.message
        },
        sampleCampaigns: campaigns?.length || 0
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}