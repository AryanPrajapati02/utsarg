import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('=== NEW DASHBOARD API CALLED ===')
    
    // Verify donor authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || payload.user_type !== 'donor') {
      console.log('Invalid token or not donor user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated donor:', payload.userId)

    // Get donor profile
    const { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, total_donated, preferred_causes')
      .eq('user_id', payload.userId)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    console.log('Found donor profile:', donorProfile.id)

    // Get donations for this donor
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        amount,
        donation_type,
        payment_status,
        created_at,
        campaigns!campaign_id(id, title, category)
      `)
      .eq('donor_id', donorProfile.id)
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Donations error:', donationsError)
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
    }

    console.log('Found donations:', donations?.length || 0)

    // Calculate basic stats
    const completedDonations = donations?.filter(d => d.payment_status === 'completed') || []
    const totalDonated = completedDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    const campaignsSupported = new Set(completedDonations.map(d => d.campaigns?.id)).size

    // Get recent donations (last 5)
    const recentDonations = donations?.slice(0, 5).map(donation => ({
      id: donation.id,
      campaign_title: donation.campaigns?.title || 'Unknown Campaign',
      amount: donation.amount,
      donation_type: donation.donation_type,
      payment_status: donation.payment_status,
      created_at: donation.created_at
    })) || []

    const stats = {
      totalDonated: Math.round(totalDonated),
      campaignsSupported,
      impactScore: Math.floor(totalDonated / 1000) + (campaignsSupported * 5),
      thisMonthDonations: 0 // Simplified for now
    }

    console.log('Returning dashboard data:', { stats, recentDonationsCount: recentDonations.length })

    return NextResponse.json({
      stats,
      recentDonations,
      recommendedCampaigns: [], // Simplified for now
      donorProfile: {
        name: donorProfile.full_name,
        preferredCauses: donorProfile.preferred_causes || []
      }
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}