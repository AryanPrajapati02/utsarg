import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('=== DONOR DONATIONS API CALLED ===')
    
    // Verify donor authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || payload.user_type !== 'donor') {
      console.log('Invalid token or not donor user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated donor:', payload.userId)

    // STEP 1: Fix orphaned profiles first (auto-repair)
    console.log('Checking for orphaned profiles...')
    
    const { data: orphanedProfiles } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, phone')
      .is('user_id', null)
    
    let profilesFixed = 0
    if (orphanedProfiles && orphanedProfiles.length > 0) {
      for (const profile of orphanedProfiles) {
        const { data: donations } = await supabaseAdmin
          .from('donations')
          .select('id')
          .eq('donor_id', profile.id)
        
        if (donations && donations.length > 0) {
          const { error: linkError } = await supabaseAdmin
            .from('donor_profiles')
            .update({ user_id: payload.userId })
            .eq('id', profile.id)
          
          if (!linkError) {
            profilesFixed++
            console.log(`Auto-linked orphaned profile ${profile.id} to user ${payload.userId}`)
          }
        }
      }
    }

    // STEP 2: Get all donor profiles for this user
    const { data: donorProfiles, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id')
      .eq('user_id', payload.userId)

    if (profileError || !donorProfiles || donorProfiles.length === 0) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 })
    }

    const allProfileIds = donorProfiles.map(p => p.id)
    console.log('Found donor profiles:', allProfileIds)

    // STEP 3: Get URL parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') // 'completed', 'pending', 'failed'
    const type = searchParams.get('type') // 'money', 'clothes', 'food', 'blood'
    const offset = (page - 1) * limit

    console.log('Query params:', { page, limit, status, type, offset })

    // STEP 4: Build query for all linked profiles
    let query = supabaseAdmin
      .from('donations')
      .select(`
        id,
        amount,
        quantity,
        donation_type,
        description,
        payment_status,
        delivery_status,
        razorpay_payment_id,
        created_at,
        campaigns(
          id,
          title,
          category,
          campaign_type,
          ngo_profiles(ngo_name)
        )
      `, { count: 'exact' })
      .in('donor_id', allProfileIds)

    // Apply filters
    if (status) {
      query = query.eq('payment_status', status)
    }
    if (type) {
      query = query.eq('donation_type', type)
    }

    // Apply pagination and ordering
    const { data: donations, error: donationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (donationsError) {
      console.error('Error fetching donations:', donationsError)
      return NextResponse.json({ 
        error: 'Failed to fetch donations',
        details: donationsError.message 
      }, { status: 500 })
    }

    console.log('Found donations:', donations?.length || 0, 'Total count:', count)

    // STEP 5: Calculate summary statistics (get all donations for stats)
    const { data: allDonations } = await supabaseAdmin
      .from('donations')
      .select('amount, payment_status, donation_type')
      .in('donor_id', allProfileIds)

    const stats = {
      totalDonations: allDonations?.length || 0,
      completedDonations: allDonations?.filter(d => d.payment_status === 'completed').length || 0,
      pendingDonations: allDonations?.filter(d => d.payment_status === 'pending').length || 0,
      totalAmount: allDonations?.filter(d => d.payment_status === 'completed')
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0,
      donationTypes: {
        money: allDonations?.filter(d => d.donation_type === 'money').length || 0,
        clothes: allDonations?.filter(d => d.donation_type === 'clothes').length || 0,
        food: allDonations?.filter(d => d.donation_type === 'food').length || 0,
        blood: allDonations?.filter(d => d.donation_type === 'blood').length || 0
      }
    }

    // STEP 6: Format donations for response
    const formattedDonations = donations?.map(donation => ({
      id: donation.id,
      campaign: {
        id: donation.campaigns?.id,
        title: donation.campaigns?.title || 'Unknown Campaign',
        category: donation.campaigns?.category,
        campaign_type: donation.campaigns?.campaign_type,
        ngo_name: donation.campaigns?.ngo_profiles?.ngo_name || 'Unknown NGO'
      },
      amount: donation.amount,
      quantity: donation.quantity,
      donation_type: donation.donation_type,
      description: donation.description,
      payment_status: donation.payment_status,
      delivery_status: donation.delivery_status,
      razorpay_payment_id: donation.razorpay_payment_id,
      created_at: donation.created_at
    })) || []

    console.log('Returning donations data:', {
      donationsCount: formattedDonations.length,
      stats,
      profilesFixed
    })

    return NextResponse.json({
      donations: formattedDonations,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      debug: {
        profilesFixed,
        totalProfiles: donorProfiles.length,
        queryParams: { page, limit, status, type }
      }
    })

  } catch (error) {
    console.error('Donor donations error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log('=== DONATIONS POST API CALLED ===')
    
    // Verify donor authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || payload.user_type !== 'donor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get donor profile (with orphaned profile fix)
    let { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (profileError || !donorProfile) {
      // Try to create a donor profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('donor_profiles')
        .insert([{
          user_id: payload.userId,
          full_name: 'Donor User',
          total_donated: 0
        }])
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json({ error: 'Donor profile not found and could not be created' }, { status: 404 })
      }
      
      donorProfile = newProfile
    }

    const { 
      campaignId, 
      donationType, 
      amount, 
      quantity, 
      description,
      razorpayPaymentId,
      razorpayOrderId 
    } = await request.json()

    // Validate required fields
    if (!campaignId || !donationType) {
      return NextResponse.json({ error: 'Campaign ID and donation type are required' }, { status: 400 })
    }

    // Validate donation type specific requirements
    if (donationType === 'money' && (!amount || amount <= 0)) {
      return NextResponse.json({ error: 'Amount is required for money donations' }, { status: 400 })
    }

    if (['clothes', 'food'].includes(donationType) && (!quantity || quantity <= 0)) {
      return NextResponse.json({ error: 'Quantity is required for item donations' }, { status: 400 })
    }

    // Verify campaign exists and is active
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, title, campaign_type, status, target_amount, raised_amount')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'active') {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 })
    }

    // Create donation record
    const donationData = {
      donor_id: donorProfile.id,
      campaign_id: campaignId,
      donation_type: donationType,
      description: description || null,
      payment_status: razorpayPaymentId ? 'completed' : 'pending',
      razorpay_payment_id: razorpayPaymentId || null,
      razorpay_order_id: razorpayOrderId || null
    }

    // Add amount or quantity based on donation type
    if (donationType === 'money') {
      donationData.amount = parseFloat(amount)
    } else {
      donationData.quantity = parseInt(quantity)
    }

    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert(donationData)
      .select()
      .single()

    if (donationError) {
      console.error('Error creating donation:', donationError)
      return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 })
    }

    // If payment is completed, update campaign raised amount and donor total
    if (razorpayPaymentId && donationType === 'money') {
      try {
        // Update campaign raised amount
        await supabaseAdmin
          .from('campaigns')
          .update({ 
            raised_amount: parseFloat(campaign.raised_amount || 0) + parseFloat(amount)
          })
          .eq('id', campaignId)

        // Update donor total donated
        const { data: currentDonor } = await supabaseAdmin
          .from('donor_profiles')
          .select('total_donated')
          .eq('id', donorProfile.id)
          .single()

        await supabaseAdmin
          .from('donor_profiles')
          .update({ 
            total_donated: parseFloat(currentDonor?.total_donated || 0) + parseFloat(amount)
          })
          .eq('id', donorProfile.id)

      } catch (updateError) {
        console.error('Error updating totals:', updateError)
        // Don't fail the donation creation if totals update fails
      }
    }

    return NextResponse.json({
      message: 'Donation created successfully',
      donation: {
        id: donation.id,
        campaign_id: campaignId,
        donation_type: donationType,
        amount: donation.amount,
        quantity: donation.quantity,
        payment_status: donation.payment_status,
        created_at: donation.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create donation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}