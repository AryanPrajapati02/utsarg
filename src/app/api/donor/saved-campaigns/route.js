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

    // Get saved campaigns
    const { data: savedCampaigns, error } = await supabase
      .from('saved_campaigns')
      .select(`
        campaign_id,
        created_at,
        campaigns (
          id,
          title,
          description,
          category,
          campaign_type,
          goal_amount,
          current_amount,
          target_quantity,
          current_quantity,
          unit,
          location,
          image_url,
          end_date,
          status,
          verification_status,
          ngos (
            name
          )
        )
      `)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedCampaigns = savedCampaigns?.map(sc => ({
      ...sc.campaigns,
      ngo_name: sc.campaigns.ngos?.name || 'Unknown NGO',
      saved_at: sc.created_at
    })) || []

    return NextResponse.json({
      campaigns: formattedCampaigns
    })

  } catch (error) {
    console.error('Get saved campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
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
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.role !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Check if campaign exists
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_campaigns')
      .select('id')
      .eq('user_id', decoded.userId)
      .eq('campaign_id', campaignId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Campaign already saved' }, { status: 400 })
    }

    // Save campaign
    const { error } = await supabase
      .from('saved_campaigns')
      .insert({
        user_id: decoded.userId,
        campaign_id: campaignId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ message: 'Campaign saved successfully' })

  } catch (error) {
    console.error('Save campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to save campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
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
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.role !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Remove saved campaign
    const { error } = await supabase
      .from('saved_campaigns')
      .delete()
      .eq('user_id', decoded.userId)
      .eq('campaign_id', campaignId)

    if (error) throw error

    return NextResponse.json({ message: 'Campaign removed from saved' })

  } catch (error) {
    console.error('Remove saved campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to remove saved campaign' },
      { status: 500 }
    )
  }
}