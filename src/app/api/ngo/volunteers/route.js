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

    // Fetch volunteer registrations for this NGO's campaigns
    const { data: campaignVolunteers, error: volunteersError } = await supabaseAdmin
      .from('volunteer_registrations')
      .select(`
        *,
        campaigns!inner(id, title, ngo_id),
        volunteer_profiles(full_name, phone, address, experience)
      `)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (volunteersError) {
      console.error('Error fetching campaign volunteers:', volunteersError)
      return NextResponse.json({ error: 'Failed to fetch campaign volunteers' }, { status: 500 })
    }

    // Fetch volunteer applications for this NGO
    const { data: volunteerApplications, error: applicationsError } = await supabaseAdmin
      .from('volunteer_applications')
      .select(`
        *,
        volunteer_profiles:users!volunteer_applications_volunteer_id_fkey(
          id,
          email,
          volunteer_profiles(full_name, phone, address, skills, experience)
        )
      `)
      .eq('ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching volunteer applications:', applicationsError)
      return NextResponse.json({ error: 'Failed to fetch volunteer applications' }, { status: 500 })
    }

    // Combine both types of volunteers
    const allVolunteers = [
      ...(campaignVolunteers || []).map(v => ({ ...v, type: 'campaign' })),
      ...(volunteerApplications || []).map(v => ({ ...v, type: 'application' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Calculate statistics
    const totalVolunteers = allVolunteers.length
    const activeVolunteers = allVolunteers.filter(v => 
      v.status === 'accepted' || v.status === 'approved'
    ).length
    const pendingApplications = allVolunteers.filter(v => 
      v.status === 'applied' || v.status === 'pending'
    ).length
    const totalHours = (campaignVolunteers || []).reduce((sum, v) => sum + (v.hours_contributed || 0), 0)

    const stats = {
      totalVolunteers,
      activeVolunteers,
      pendingApplications,
      totalHours
    }

    return NextResponse.json({
      volunteers: allVolunteers,
      stats
    })

  } catch (error) {
    console.error('NGO volunteers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}