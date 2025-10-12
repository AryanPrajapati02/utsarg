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

    // Get donor profile
    const { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
      .eq('user_id', donorUser.id)
      .single()

    if (profileError || !donorProfile) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    // Get all donations for this donor
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        amount,
        donation_type,
        payment_status,
        created_at,
        campaign_id,
        campaigns!campaign_id(
          id, 
          title, 
          category, 
          campaign_type,
          target_amount,
          raised_amount,
          ngo_profiles!ngo_id(ngo_name)
        )
      `)
      .eq('donor_id', donorProfile.id)
      .order('created_at', { ascending: false })

    // Get recommended campaigns
    const { data: recommendedCampaigns, error: campaignsError } = await supabaseAdmin
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
        status,
        ngo_profiles!ngo_id(ngo_name)
      `)
      .eq('status', 'active')
      .limit(5)

    // Check for any data issues
    const issues = []
    
    // Check donations
    if (!donations || donations.length === 0) {
      issues.push('No donations found for this donor')
    } else {
      donations.forEach((donation, index) => {
        if (!donation.campaigns) {
          issues.push(`Donation ${index + 1} (${donation.id}) has no campaign data`)
        } else if (!donation.campaigns.ngo_profiles) {
          issues.push(`Donation ${index + 1} campaign has no NGO data`)
        }
      })
    }

    // Check recommended campaigns
    if (!recommendedCampaigns || recommendedCampaigns.length === 0) {
      issues.push('No recommended campaigns found')
    } else {
      recommendedCampaigns.forEach((campaign, index) => {
        if (!campaign.ngo_profiles) {
          issues.push(`Recommended campaign ${index + 1} (${campaign.title}) has no NGO data`)
        }
        if (campaign.campaign_type === 'money' && !campaign.target_amount) {
          issues.push(`Recommended campaign ${index + 1} (${campaign.title}) has no target amount`)
        }
      })
    }

    return NextResponse.json({
      donorUser,
      donorProfile,
      donations: {
        count: donations?.length || 0,
        data: donations || [],
        error: donationsError?.message
      },
      recommendedCampaigns: {
        count: recommendedCampaigns?.length || 0,
        data: recommendedCampaigns || [],
        error: campaignsError?.message
      },
      issues,
      summary: {
        donorHasProfile: !!donorProfile,
        donorHasDonations: donations && donations.length > 0,
        donorHasRecommendations: recommendedCampaigns && recommendedCampaigns.length > 0,
        totalIssues: issues.length
      }
    })

  } catch (error) {
    console.error('Debug dashboard display error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}