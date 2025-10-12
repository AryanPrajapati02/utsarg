import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 50
    const offset = parseInt(searchParams.get('offset')) || 0
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    let query = supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        ngo_profiles!inner(
          ngo_name,
          verification_status
        )
      `)
      .eq('status', status)
      .in('ngo_profiles.verification_status', ['approved', 'verified', 'pending'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (type) {
      query = query.eq('campaign_type', type)
    }

    const { data: campaigns, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (category) {
      countQuery = countQuery.eq('category', category)
    }

    if (type) {
      countQuery = countQuery.eq('campaign_type', type)
    }

    const { count } = await countQuery

    return NextResponse.json({
      campaigns: campaigns || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Verify token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { verifyToken } = await import('@/lib/auth')
    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      campaignType,
      targetAmount,
      targetItems,
      startDate,
      endDate,
      location,
      images
    } = body

    // Validate required fields
    if (!title || !description || !category || !campaignType || !startDate || !endDate || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json(
        { error: 'NGO profile not found' },
        { status: 404 }
      )
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        ngo_id: ngoProfile.id,
        title,
        description,
        category,
        campaign_type: campaignType,
        target_amount: campaignType === 'money' ? targetAmount : null,
        target_items: ['clothes', 'food'].includes(campaignType) ? targetItems : null,
        start_date: startDate,
        end_date: endDate,
        location,
        images: images || [],
        status: 'active'
      })
      .select()
      .single()

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign
    })

  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}