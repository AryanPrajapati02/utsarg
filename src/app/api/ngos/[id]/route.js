import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Fetch NGO details with campaigns
    const { data: ngo, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select(`
        id,
        ngo_name,
        description,
        website,
        phone,
        address,
        registered_district,
        registered_state,
        darpan_id,
        npo_type,
        logo_url,
        created_at,
        verification_status
      `)
      .eq('id', id)
      .in('verification_status', ['approved', 'verified'])
      .single()

    if (ngoError || !ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }

    // Fetch NGO's active campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        target_amount,
        raised_amount,
        category,
        status,
        created_at,
        end_date
      `)
      .eq('ngo_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)

    return NextResponse.json({
      ngo,
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('NGO detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}