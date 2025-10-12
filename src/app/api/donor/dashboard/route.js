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
    
    if (!payload || payload.user_type !== 'donor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get donor profile
    const { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, total_donated, preferred_causes')
      .eq('user_id', payload.userId)
      .single()

    if (profileError || !donorProfile) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    // Get donation statistics
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        amount,
        donation_type,
        payment_status,
        created_at,
        campaigns(id, title, category)
      `)
      .eq('donor_id', donorProfile.id)
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Error fetching donations:', donationsError)
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
    }

    // Calculate statistics
    const completedDonations = donations?.filter(d => d.payment_status === 'completed') || []
    const totalDonated = completedDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    // Get unique campaigns supported
    const campaignsSupported = new Set(completedDonations.map(d => d.campaigns?.id)).size
    
    // Calculate this month donations
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonthDonations = completedDonations
      .filter(d => {
        const donationDate = new Date(d.created_at)
        return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear
      })
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

    // Calculate impact score (simple algorithm based on donations and campaigns)
    const impactScore = Math.floor(totalDonated / 1000) + (campaignsSupported * 5)

    // Get recent donations (last 5)
    const recentDonations = donations?.slice(0, 5).map(donation => ({
      id: donation.id,
      campaign_title: donation.campaigns?.title || 'Unknown Campaign',
      amount: donation.amount,
      donation_type: donation.donation_type,
      payment_status: donation.payment_status,
      created_at: donation.created_at
    })) || []

    // Get recommended campaigns based on donor's preferred causes and donation history
    let recommendedCampaigns = []
    try {
      const preferredCauses = donorProfile.preferred_causes || []
      const donatedCampaignIds = completedDonations.map(d => d.campaigns?.id).filter(Boolean)
      
      let query = supabaseAdmin
        .from('campaigns')
        .select(`
          id,
          title,
          description,
          category,
          campaign_type,
          target_amount,
          raised_amount,
          location,
          end_date,
          ngo_profiles!inner(ngo_name)
        `)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString().split('T')[0])
        .limit(6)

      // Filter out campaigns already donated to
      if (donatedCampaignIds.length > 0) {
        query = query.not('id', 'in', `(${donatedCampaignIds.join(',')})`)
      }

      // If donor has preferred causes, prioritize those
      if (preferredCauses.length > 0) {
        query = query.in('category', preferredCauses)
      }

      const { data: campaigns } = await query.order('created_at', { ascending: false })
      
      recommendedCampaigns = campaigns?.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        campaign_type: campaign.campaign_type,
        target_amount: campaign.target_amount,
        raised_amount: campaign.raised_amount,
        location: campaign.location,
        ngo_name: campaign.ngo_profiles?.ngo_name
      })) || []

    } catch (error) {
      console.error('Error fetching recommended campaigns:', error)
    }

    const stats = {
      totalDonated: Math.round(totalDonated),
      campaignsSupported,
      impactScore,
      thisMonthDonations: Math.round(thisMonthDonations)
    }

    return NextResponse.json({
      stats,
      recentDonations,
      recommendedCampaigns,
      donorProfile: {
        name: donorProfile.full_name,
        preferredCauses: donorProfile.preferred_causes || []
      }
    })

  } catch (error) {
    console.error('Donor dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}