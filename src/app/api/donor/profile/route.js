import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
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

    if (!user || user.user_type !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('donor_profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single()

    // Get user email
    const { data: userEmail } = await supabase
      .from('users')
      .select('email, created_at')
      .eq('id', decoded.userId)
      .single()

    // Get donation statistics
    const { data: donations } = await supabase
      .from('donations')
      .select('amount, created_at, payment_status')
      .eq('donor_id', profile?.id)

    const completedDonations = donations?.filter(d => d.payment_status === 'completed') || []
    const totalDonated = completedDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    // Get campaigns supported
    const { data: campaignsSupported } = await supabase
      .from('donations')
      .select('campaign_id')
      .eq('donor_id', profile?.id)
      .eq('payment_status', 'completed')

    const uniqueCampaigns = new Set(campaignsSupported?.map(d => d.campaign_id) || [])

    // Calculate donor tier
    let donorTier = 'Bronze'
    if (totalDonated >= 100000) donorTier = 'Gold'
    else if (totalDonated >= 25000) donorTier = 'Silver'

    return NextResponse.json({
      profile: {
        full_name: profile?.full_name || '',
        email: userEmail?.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        city: '', // Not in donor_profiles schema
        state: '', // Not in donor_profiles schema
        pincode: '', // Not in donor_profiles schema
        date_of_birth: '', // Not in donor_profiles schema
        occupation: '', // Not in donor_profiles schema
        interests: profile?.preferred_causes || [],
        notification_preferences: {
          email_updates: true,
          sms_updates: false,
          campaign_recommendations: true,
          donation_receipts: true
        }
      },
      stats: {
        totalDonated: Math.round(totalDonated),
        campaignsSupported: uniqueCampaigns.size,
        impactScore: Math.floor(totalDonated / 1000) + uniqueCampaigns.size * 10,
        memberSince: userEmail?.created_at,
        donorTier
      }
    })

  } catch (error) {
    console.error('Get donor profile error:', error)
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

    if (!user || user.user_type !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profileData = await request.json()

    // Validate required fields
    if (!profileData.full_name || profileData.full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    // Validate phone format if provided
    if (profileData.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(profileData.phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Update or insert profile
    const { data: existingProfile } = await supabase
      .from('donor_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    const updateData = {
      user_id: decoded.userId,
      full_name: profileData.full_name.trim(),
      phone: profileData.phone?.trim() || null,
      address: profileData.address?.trim() || null,
      preferred_causes: profileData.interests || [],
      updated_at: new Date().toISOString()
    }

    let result
    if (existingProfile) {
      result = await supabase
        .from('donor_profiles')
        .update(updateData)
        .eq('user_id', decoded.userId)
        .select()
        .single()
    } else {
      updateData.created_at = new Date().toISOString()
      result = await supabase
        .from('donor_profiles')
        .insert(updateData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating profile:', result.error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: result.data
    })

  } catch (error) {
    console.error('Update donor profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}