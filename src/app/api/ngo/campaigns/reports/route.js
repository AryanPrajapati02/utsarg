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
      .from('campaign_reports')
      .select(`
        *,
        campaigns!inner(
          id,
          title,
          ngo_id
        )
      `)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: reports, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })

  } catch (error) {
    console.error('Reports fetch error:', error)
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
      reportType,
      title,
      description,
      amountUtilized,
      itemsUtilized,
      expenses,
      achievements,
      challenges,
      nextSteps,
      images,
      documents,
      isPublished
    } = body

    // Validate required fields
    if (!campaignId || !title || !description) {
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

    // Create report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('campaign_reports')
      .insert({
        campaign_id: campaignId,
        report_type: reportType || 'utilization',
        title,
        description,
        amount_utilized: amountUtilized || null,
        items_utilized: itemsUtilized || null,
        expenses: expenses || [],
        achievements: achievements || null,
        challenges: challenges || null,
        next_steps: nextSteps || null,
        images: images || [],
        documents: documents || [],
        is_published: isPublished || false,
        published_at: isPublished ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report creation error:', reportError)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Report created successfully',
      report
    })

  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}