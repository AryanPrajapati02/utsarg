import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Fetch campaign with NGO details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        ngo:ngo_profiles(
          id,
          ngo_name,
          description,
          logo_url,
          website,
          verification_status
        )
      `)
      .eq('id', id)
      .eq('status', 'active') // Only show active campaigns to public
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get donation count for this campaign
    const { count: donorCount } = await supabase
      .from('donations')
      .select('donor_id', { count: 'exact' })
      .eq('campaign_id', id)
      .eq('payment_status', 'completed')

    // Add donor count to campaign data
    campaign.donor_count = donorCount || 0
    
    // Map database field names to frontend expected names
    campaign.goal_amount = campaign.target_amount || 0
    campaign.amount_raised = campaign.raised_amount || 0
    
    // Handle campaign image - extract first image from images array if available
    if (campaign.images && Array.isArray(campaign.images) && campaign.images.length > 0) {
      campaign.image_url = campaign.images[0]
    } else {
      campaign.image_url = null
    }

    return NextResponse.json({
      campaign
    })

  } catch (error) {
    console.error('Campaign details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}