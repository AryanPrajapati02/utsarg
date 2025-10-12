import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Get report with campaign info
    const { data: report, error } = await supabaseAdmin
      .from('campaign_reports')
      .select(`
        *,
        campaigns!inner(
          id,
          title,
          ngo_id,
          campaign_type,
          target_amount,
          raised_amount,
          target_items,
          collected_items
        )
      `)
      .eq('id', reportId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Report fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params
    const body = await request.json()
    const {
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

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify report belongs to this NGO
    const { data: existingReport, error: reportError } = await supabaseAdmin
      .from('campaign_reports')
      .select(`
        id,
        is_published,
        campaigns!inner(ngo_id)
      `)
      .eq('id', reportId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (reportError || !existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Update report
    const updateData = {
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
      updated_at: new Date().toISOString()
    }

    // Set published_at if publishing for the first time
    if (isPublished && !existingReport.is_published) {
      updateData.published_at = new Date().toISOString()
    }

    const { data: report, error: updateError } = await supabaseAdmin
      .from('campaign_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (updateError) {
      console.error('Report update error:', updateError)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Report updated successfully',
      report
    })

  } catch (error) {
    console.error('Report update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify report belongs to this NGO
    const { data: report, error: reportError } = await supabaseAdmin
      .from('campaign_reports')
      .select(`
        id,
        campaigns!inner(ngo_id)
      `)
      .eq('id', reportId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Delete report
    const { error: deleteError } = await supabaseAdmin
      .from('campaign_reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      console.error('Report deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Report deleted successfully' })

  } catch (error) {
    console.error('Report deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}