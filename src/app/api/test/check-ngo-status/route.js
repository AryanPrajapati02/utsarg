import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all NGO profiles with their verification status
    const { data: ngos, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id, ngo_name, verification_status, created_at')
      .order('created_at', { ascending: false })

    if (ngoError) {
      return NextResponse.json({ error: ngoError.message }, { status: 500 })
    }

    // Get all campaigns with their status
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id, 
        title, 
        status, 
        ngo_id,
        ngo_profiles!ngo_id(ngo_name, verification_status)
      `)
      .order('created_at', { ascending: false })

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 })
    }

    return NextResponse.json({
      ngos: ngos || [],
      campaigns: campaigns || [],
      summary: {
        totalNGOs: ngos?.length || 0,
        approvedNGOs: ngos?.filter(n => n.verification_status === 'approved').length || 0,
        pendingNGOs: ngos?.filter(n => n.verification_status === 'pending').length || 0,
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
        campaignsFromApprovedNGOs: campaigns?.filter(c => c.ngo_profiles?.verification_status === 'approved').length || 0
      }
    })

  } catch (error) {
    console.error('Check NGO status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}