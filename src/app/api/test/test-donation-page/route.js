import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get a sample campaign to test the donation page
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        category,
        campaign_type,
        target_amount,
        raised_amount,
        target_items,
        collected_items,
        start_date,
        end_date,
        location,
        images,
        status,
        ngo_profiles!ngo_id(
          id,
          ngo_name,
          description,
          website,
          logo_url,
          verification_status
        )
      `)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'No active campaigns found' }, { status: 404 })
    }

    // Format the response to match what the donation page expects
    const formattedCampaign = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      campaign_type: campaign.campaign_type,
      target_amount: campaign.target_amount,
      raised_amount: campaign.raised_amount,
      target_items: campaign.target_items,
      collected_items: campaign.collected_items,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      location: campaign.location,
      images: campaign.images,
      status: campaign.status,
      ngo: {
        id: campaign.ngo_profiles.id,
        ngo_name: campaign.ngo_profiles.ngo_name,
        description: campaign.ngo_profiles.description,
        website: campaign.ngo_profiles.website,
        logo_url: campaign.ngo_profiles.logo_url,
        verification_status: campaign.ngo_profiles.verification_status
      },
      donor_count: 4, // Mock data
      goal_amount: campaign.target_amount,
      amount_raised: campaign.raised_amount,
      image_url: campaign.images?.[0] || null
    }

    return NextResponse.json({
      campaign: formattedCampaign,
      donationPageUrl: `http://localhost:3000/donate/${campaign.id}`,
      message: 'Test campaign data for donation page'
    })

  } catch (error) {
    console.error('Test donation page error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}