import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('=== DONOR DASHBOARD API CALLED ===')
    
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

    // STEP 1: Fix orphaned profiles first (auto-repair)
    console.log('Checking for orphaned profiles...')
    
    // Find orphaned profiles that have donations
    const { data: orphanedProfiles } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, phone')
      .is('user_id', null)
    
    let profilesFixed = 0
    if (orphanedProfiles && orphanedProfiles.length > 0) {
      for (const profile of orphanedProfiles) {
        const { data: donations } = await supabaseAdmin
          .from('donations')
          .select('id')
          .eq('donor_id', profile.id)
        
        if (donations && donations.length > 0) {
          // Link this orphaned profile to the authenticated user
          const { error: linkError } = await supabaseAdmin
            .from('donor_profiles')
            .update({ user_id: payload.userId })
            .eq('id', profile.id)
          
          if (!linkError) {
            profilesFixed++
            console.log(`Auto-linked orphaned profile ${profile.id} to user ${payload.userId}`)
          }
        }
      }
    }

    // STEP 2: Get donor profile (now should include any previously orphaned profiles)
    const { data: donorProfiles, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, total_donated, preferred_causes')
      .eq('user_id', payload.userId)

    if (profileError || !donorProfiles || donorProfiles.length === 0) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    // Use the first profile (or merge data from multiple profiles if needed)
    const donorProfile = donorProfiles[0]
    const allProfileIds = donorProfiles.map(p => p.id)
    
    console.log('Found donor profiles:', allProfileIds)

    // STEP 3: Get donations for all linked profiles
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        amount,
        donation_type,
        payment_status,
        created_at,
        campaign_id,
        campaigns!campaign_id(id, title, category)
      `)
      .in('donor_id', allProfileIds)
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Error fetching donations:', donationsError)
      return NextResponse.json({ 
        error: 'Failed to fetch donations', 
        details: donationsError.message 
      }, { status: 500 })
    }

    console.log('Found donations:', donations?.length || 0)

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

    // STEP 4: Update the main profile's total_donated if needed
    if (totalDonated !== donorProfile.total_donated) {
      await supabaseAdmin
        .from('donor_profiles')
        .update({ total_donated: totalDonated })
        .eq('id', donorProfile.id)
      
      console.log(`Updated profile total_donated to ${totalDonated}`)
    }

    console.log('Donations data:', { 
      donationsCount: donations?.length || 0, 
      recentDonationsCount: recentDonations.length,
      totalDonated,
      campaignsSupported,
      profilesFixed
    })

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
          ngo_profiles!ngo_id(ngo_name)
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
      },
      debug: {
        profilesFixed,
        totalProfiles: donorProfiles.length,
        totalDonations: donations?.length || 0
      }
    })

  } catch (error) {
    console.error('Donor dashboard error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}