import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check all NGOs and their verification status
    const { data: allNgos, error: allError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id, ngo_name, verification_status, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all NGOs:', allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Check approved NGOs specifically
    const { data: approvedNgos, error: approvedError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id, ngo_name, verification_status')
      .eq('verification_status', 'approved')

    if (approvedError) {
      console.error('Error fetching approved NGOs:', approvedError)
    }

    // Get verification status counts
    const statusCounts = {}
    allNgos.forEach(ngo => {
      statusCounts[ngo.verification_status] = (statusCounts[ngo.verification_status] || 0) + 1
    })

    return NextResponse.json({
      message: 'NGO data check',
      totalNgos: allNgos.length,
      approvedNgos: approvedNgos?.length || 0,
      statusCounts,
      allNgos: allNgos.slice(0, 5), // First 5 for preview
      approvedNgos: approvedNgos?.slice(0, 5) || []
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}