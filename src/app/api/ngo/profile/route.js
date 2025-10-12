import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ngoId = searchParams.get('id');

    // If ID is provided, fetch public NGO profile
    if (ngoId) {
      const { data: ngoProfile, error: ngoError } = await supabase
        .from('ngo_profiles')
        .select('*')
        .eq('id', ngoId)
        .eq('verification_status', 'approved')
        .single();

      if (ngoError || !ngoProfile) {
        return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
      }

      return NextResponse.json(ngoProfile);
    }

    // Otherwise, require authentication for own profile
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify user role
    const { data: user } = await supabase
      .from('users')
      .select('user_type, email, created_at')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get NGO profile
    const { data: ngoProfile } = await supabase
      .from('ngo_profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single()

    if (!ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Get campaign statistics
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, status, goal_amount, raised_amount, created_at')
      .eq('ngo_id', ngoProfile.id)

    const activeCampaigns = campaigns?.filter(c => c.status === 'active') || []
    const completedCampaigns = campaigns?.filter(c => c.status === 'completed') || []
    const totalRaised = campaigns?.reduce((sum, c) => sum + (parseFloat(c.raised_amount) || 0), 0) || 0

    // Get volunteer statistics
    const { data: volunteers } = await supabase
      .from('volunteer_registrations')
      .select('id, status')
      .in('campaign_id', campaigns?.map(c => c.id) || [])

    const activeVolunteers = volunteers?.filter(v => v.status === 'approved') || []

    return NextResponse.json({
      profile: {
        ngo_name: ngoProfile.ngo_name,
        email: user.email,
        darpan_id: ngoProfile.darpan_id,
        npo_type: ngoProfile.npo_type,
        registered_state: ngoProfile.registered_state,
        registered_district: ngoProfile.registered_district,
        description: ngoProfile.description || '',
        contact_person: ngoProfile.contact_person || '',
        phone: ngoProfile.phone || '',
        address: ngoProfile.address || '',
        website: ngoProfile.website || '',
        logo_url: ngoProfile.logo_url || '',
        verification_status: ngoProfile.verification_status,
        verification_notes: ngoProfile.verification_notes || ''
      },
      stats: {
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns: activeCampaigns.length,
        completedCampaigns: completedCampaigns.length,
        totalRaised: Math.round(totalRaised),
        activeVolunteers: activeVolunteers.length,
        memberSince: user.created_at,
        verificationStatus: ngoProfile.verification_status
      }
    })

  } catch (error) {
    console.error('Get NGO profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify user role
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profileData = await request.json()

    // Validate required fields
    if (!profileData.ngo_name || profileData.ngo_name.trim().length === 0) {
      return NextResponse.json({ error: 'NGO name is required' }, { status: 400 })
    }

    if (!profileData.contact_person || profileData.contact_person.trim().length === 0) {
      return NextResponse.json({ error: 'Contact person is required' }, { status: 400 })
    }

    // Validate phone format if provided
    if (profileData.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(profileData.phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Validate website URL if provided
    if (profileData.website && profileData.website.trim()) {
      try {
        new URL(profileData.website)
      } catch {
        return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 })
      }
    }

    // Get existing NGO profile
    const { data: existingProfile } = await supabase
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    if (!existingProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Update profile (only allow updating certain fields)
    const updateData = {
      description: profileData.description?.trim() || null,
      contact_person: profileData.contact_person.trim(),
      phone: profileData.phone?.trim() || null,
      address: profileData.address?.trim() || null,
      website: profileData.website?.trim() || null,
      updated_at: new Date().toISOString()
    }

    const { data: updatedProfile, error } = await supabase
      .from('ngo_profiles')
      .update(updateData)
      .eq('user_id', decoded.userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating NGO profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Update NGO profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}