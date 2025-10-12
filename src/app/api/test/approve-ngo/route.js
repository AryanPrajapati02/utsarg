import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Get all pending NGOs and approve them
    const { data: pendingNGOs, error: fetchError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id, ngo_name, verification_status')
      .eq('verification_status', 'pending')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!pendingNGOs || pendingNGOs.length === 0) {
      return NextResponse.json({ message: 'No pending NGOs to approve' })
    }

    // Approve all pending NGOs
    const { data: approvedNGOs, error: updateError } = await supabaseAdmin
      .from('ngo_profiles')
      .update({ verification_status: 'approved' })
      .eq('verification_status', 'pending')
      .select('id, ngo_name, verification_status')

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully approved NGOs',
      approvedCount: approvedNGOs?.length || 0,
      approvedNGOs: approvedNGOs || []
    })

  } catch (error) {
    console.error('Approve NGO error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}