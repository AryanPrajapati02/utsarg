import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    // Verify NGO authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || payload.user_type !== 'ngo' || !payload.isApproved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || userId !== payload.userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Fetch donations for this NGO's campaigns
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        *,
        campaigns!inner(id, title, ngo_id),
        donor_profiles(id, full_name, phone)
      `)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (donationsError) {
      console.error('Error fetching donations:', donationsError)
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
    }

    // Calculate statistics
    const completedDonations = donations?.filter(d => d.payment_status === 'completed') || []
    const pendingDonations = donations?.filter(d => d.payment_status === 'pending') || []
    
    const totalAmount = completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
    const pendingAmount = pendingDonations.reduce((sum, d) => sum + (d.amount || 0), 0)

    const stats = {
      totalDonations: donations?.length || 0,
      totalAmount,
      pendingAmount,
      completedDonations: completedDonations.length
    }

    return NextResponse.json({
      donations: donations || [],
      stats
    })

  } catch (error) {
    console.error('NGO donations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}