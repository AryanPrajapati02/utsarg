import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id: campaignId } = await params

    // Get published reports for the campaign
    const { data: reports, error } = await supabaseAdmin
      .from('campaign_reports')
      .select(`
        id,
        report_type,
        title,
        description,
        amount_utilized,
        items_utilized,
        expenses,
        achievements,
        challenges,
        next_steps,
        images,
        documents,
        published_at,
        campaigns!inner(
          id,
          title,
          campaign_type,
          target_amount,
          raised_amount,
          target_items,
          collected_items,
          ngo_profiles!inner(
            ngo_name,
            verification_status
          )
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_published', true)
      .eq('campaigns.ngo_profiles.verification_status', 'approved')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Reports fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })

  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}