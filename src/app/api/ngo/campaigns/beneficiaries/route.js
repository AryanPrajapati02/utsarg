import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const reportId = searchParams.get('reportId')

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    let query = supabaseAdmin
      .from('beneficiaries')
      .select(`
        *,
        campaigns!inner(
          id,
          title,
          ngo_id
        ),
        campaign_reports(
          id,
          title
        )
      `)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (reportId) {
      query = query.eq('report_id', reportId)
    }

    const { data: beneficiaries, error } = await query

    if (error) {
      console.error('Beneficiaries fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch beneficiaries' }, { status: 500 })
    }

    return NextResponse.json({ beneficiaries: beneficiaries || [] })

  } catch (error) {
    console.error('Beneficiaries fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      campaignId,
      reportId,
      name,
      age,
      gender,
      location,
      contactInfo,
      assistanceType,
      assistanceDetails,
      assistanceDate,
      amountReceived,
      itemsReceived,
      notes
    } = body

    // Validate required fields
    if (!campaignId || !name) {
      return NextResponse.json(
        { error: 'Campaign ID and name are required' },
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
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify campaign belongs to this NGO
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, title')
      .eq('id', campaignId)
      .eq('ngo_id', ngoProfile.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // If reportId is provided, verify it belongs to this campaign
    if (reportId) {
      const { data: report, error: reportError } = await supabaseAdmin
        .from('campaign_reports')
        .select('id')
        .eq('id', reportId)
        .eq('campaign_id', campaignId)
        .single()

      if (reportError || !report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
    }

    // Create beneficiary
    const { data: beneficiary, error: beneficiaryError } = await supabaseAdmin
      .from('beneficiaries')
      .insert({
        campaign_id: campaignId,
        report_id: reportId || null,
        name,
        age: age || null,
        gender: gender || null,
        location: location || null,
        contact_info: contactInfo || {},
        assistance_type: assistanceType || null,
        assistance_details: assistanceDetails || null,
        assistance_date: assistanceDate || null,
        amount_received: amountReceived || null,
        items_received: itemsReceived || null,
        notes: notes || null,
        status: 'active'
      })
      .select()
      .single()

    if (beneficiaryError) {
      console.error('Beneficiary creation error:', beneficiaryError)
      return NextResponse.json({ error: 'Failed to create beneficiary' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Beneficiary added successfully',
      beneficiary
    })

  } catch (error) {
    console.error('Beneficiary creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}