import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify user role
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.user_type !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || 'active'
    const sortBy = searchParams.get('sortBy') || 'created_at'

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
        location,
        images,
        start_date,
        end_date,
        status,
        created_at,
        ngo:ngo_profiles (
          id,
          ngo_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (type) {
      query = query.eq('campaign_type', type)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    // Apply sorting
    const sortOrder = sortBy === 'end_date' ? { ascending: true } : { ascending: false }
    query = query.order(sortBy, sortOrder)

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: campaigns, error: campaignsError, count } = await query

    if (campaignsError) throw campaignsError

    // Get donation counts for each campaign
    const campaignIds = campaigns?.map(c => c.id) || []
    const { data: donationCounts } = await supabase
      .from('donations')
      .select('campaign_id')
      .in('campaign_id', campaignIds)
      .eq('payment_status', 'completed')

    const donorCounts = {}
    donationCounts?.forEach(d => {
      donorCounts[d.campaign_id] = (donorCounts[d.campaign_id] || 0) + 1
    })

    // Get saved campaigns for this user
    const { data: savedCampaigns } = await supabase
      .from('saved_campaigns')
      .select('campaign_id')
      .eq('user_id', decoded.userId)

    const savedCampaignIds = savedCampaigns?.map(sc => sc.campaign_id) || []

    // Format campaigns data with field mapping
    const formattedCampaigns = campaigns?.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      campaign_type: campaign.campaign_type,
      goal_amount: campaign.target_amount || 0,
      current_amount: campaign.raised_amount || 0,
      target_quantity: campaign.target_items || 0,
      current_quantity: campaign.collected_items || 0,
      location: campaign.location,
      image_url: campaign.images && campaign.images.length > 0 ? campaign.images[0] : null,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status,
      created_at: campaign.created_at,
      ngo_name: campaign.ngo?.ngo_name || 'Unknown NGO',
      ngo_id: campaign.ngo?.id,
      donors_count: donorCounts[campaign.id] || 0
    })) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      campaigns: formattedCampaigns,
      savedCampaigns: savedCampaignIds,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Donor campaigns API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}