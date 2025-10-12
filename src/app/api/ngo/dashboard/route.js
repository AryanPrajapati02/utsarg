import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Verify token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.userId !== userId || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Get campaign statistics
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('ngo_id', ngoProfile.id)

    if (campaignsError) {
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Calculate stats
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0)

    // Get donation count
    const { count: donorCount } = await supabaseAdmin
      .from('donations')
      .select('donor_id', { count: 'exact', head: true })
      .in('campaign_id', campaigns.map(c => c.id))

    // Get volunteer count (campaign-specific)
    const { count: volunteerCount } = await supabaseAdmin
      .from('volunteer_registrations')
      .select('volunteer_id', { count: 'exact', head: true })
      .in('campaign_id', campaigns.map(c => c.id))

    // Get volunteer applications (general NGO applications)
    const { data: volunteerApplications, count: applicationCount } = await supabaseAdmin
      .from('volunteer_applications')
      .select(`
        *,
        volunteer_profiles:users!volunteer_applications_volunteer_id_fkey(
          id,
          email,
          volunteer_profiles(full_name, phone, address, skills, experience)
        )
      `, { count: 'exact' })
      .eq('ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    // Get pending applications count
    const pendingApplications = volunteerApplications?.filter(app => app.status === 'pending') || []

    // Get recent campaigns (last 5)
    const recentCampaigns = campaigns
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    const stats = {
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      totalDonors: donorCount || 0,
      totalVolunteers: (volunteerCount || 0) + (applicationCount || 0),
      pendingVolunteerApplications: pendingApplications.length
    }

    return NextResponse.json({
      stats,
      recentCampaigns,
      ngoProfile,
      pendingVolunteerApplications: pendingApplications.slice(0, 5) // Show latest 5 pending applications
    })

  } catch (error) {
    console.error('NGO dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}