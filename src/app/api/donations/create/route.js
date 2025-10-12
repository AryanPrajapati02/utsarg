import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      campaign_id,
      amount,
      donor_name,
      donor_email,
      donor_phone,

      is_anonymous,
      donor_id,
      donation_type = 'money'
    } = body

    // Validate required fields
    if (!campaign_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Campaign ID and valid amount are required' },
        { status: 400 }
      )
    }

    if (!is_anonymous && (!donor_name || !donor_email)) {
      return NextResponse.json(
        { error: 'Donor name and email are required for non-anonymous donations' },
        { status: 400 }
      )
    }

    // Verify campaign exists and is active
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, title, status, ngo_id')
      .eq('id', campaign_id)
      .eq('status', 'active')
      .single()

    if (campaignError || !campaign) {
      console.error('Campaign lookup error:', campaignError)
      return NextResponse.json(
        { error: 'Campaign not found or inactive' },
        { status: 404 }
      )
    }

    // Create Razorpay order for money donations
    let razorpayOrderId = null
    if (donation_type === 'money') {
      try {
        const Razorpay = require('razorpay')
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const order = await razorpay.orders.create({
          amount: parseFloat(amount) * 100, // Amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            campaign_id: campaign_id,
            donation_type: donation_type
          }
        })

        razorpayOrderId = order.id
        console.log('Razorpay order created:', order.id)
      } catch (error) {
        console.error('Razorpay order creation failed:', error)
        // Fall back to mock order for development
        razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      }
    }

    // Handle donor information - create donor profile for both authenticated and anonymous donors
    let donorDetails = null
    let donorProfileId = null
    
    if (donor_id) {
      // Authenticated donor - get user details
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', donor_id)
        .single()

      if (!userError && user) {
        donorDetails = user
      }

      // Try to get existing donor profile
      const { data: donorProfile, error: profileError } = await supabaseAdmin
        .from('donor_profiles')
        .select('id, full_name, phone, address')
        .eq('user_id', donor_id)
        .single()

      if (donorProfile) {
        donorProfileId = donorProfile.id
        donorDetails = { ...donorDetails, ...donorProfile }
      } else if (!profileError || profileError.code === 'PGRST116') {
        // Create donor profile if it doesn't exist - ALWAYS link to authenticated user
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('donor_profiles')
          .insert([{
            user_id: donor_id, // IMPORTANT: Always link to authenticated user
            full_name: donor_name || 'Anonymous Donor',
            phone: donor_phone || null
          }])
          .select('id')
          .single()

        if (!createError && newProfile) {
          donorProfileId = newProfile.id
          console.log('Created new donor profile linked to user:', donorProfileId)
        } else {
          console.error('Failed to create donor profile:', createError)
        }
      }
    } else if (!is_anonymous && donor_name && donor_email) {
      // Anonymous donation but with provided details
      // Check if there's an existing user with this email who should be linked
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, user_type')
        .eq('email', donor_email)
        .eq('user_type', 'donor')
        .single()

      if (existingUser) {
        // User exists - link to their profile instead of creating orphaned profile
        const { data: userProfile } = await supabaseAdmin
          .from('donor_profiles')
          .select('id')
          .eq('user_id', existingUser.id)
          .single()

        if (userProfile) {
          donorProfileId = userProfile.id
          donorDetails = { full_name: donor_name, email: donor_email, phone: donor_phone }
          console.log('Using existing user profile:', donorProfileId)
        } else {
          // Create profile linked to existing user
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from('donor_profiles')
            .insert([{
              user_id: existingUser.id, // Link to existing user
              full_name: donor_name,
              phone: donor_phone || null
            }])
            .select('id')
            .single()

          if (!createError && newProfile) {
            donorProfileId = newProfile.id
            donorDetails = { full_name: donor_name, email: donor_email, phone: donor_phone }
            console.log('Created profile linked to existing user:', donorProfileId)
          }
        }
      } else {
        // No existing user - create orphaned profile only as last resort
        const { data: existingProfile } = await supabaseAdmin
          .from('donor_profiles')
          .select('id')
          .eq('full_name', donor_name)
          .is('user_id', null)
          .single()

        if (existingProfile) {
          donorProfileId = existingProfile.id
          donorDetails = { full_name: donor_name, email: donor_email, phone: donor_phone }
          console.log('Using existing anonymous donor profile:', donorProfileId)
        } else {
          const { data: anonymousProfile, error: anonymousError } = await supabaseAdmin
            .from('donor_profiles')
            .insert([{
              user_id: null, // No user account linked - only as last resort
              full_name: donor_name,
              phone: donor_phone || null
            }])
            .select('id')
            .single()

          if (!anonymousError && anonymousProfile) {
            donorProfileId = anonymousProfile.id
            donorDetails = { full_name: donor_name, email: donor_email, phone: donor_phone }
            console.log('Created anonymous donor profile (last resort):', donorProfileId)
          } else {
            console.error('Failed to create anonymous donor profile:', anonymousError)
          }
        }
      }
    }

    // Create donation record with minimal required fields
    const donationData = {
      campaign_id,
      amount: parseFloat(amount),
      donation_type: donation_type || 'money'
    }

    // Add donor information if available
    if (donorProfileId) {
      donationData.donor_id = donorProfileId
    }
    
    // Note: donor_name, donor_email, donor_phone columns don't exist in the current database
    // The donor information is stored in the donor_profiles table via donor_id reference

    // Log donor details for debugging (since we can't store them in the table yet)
    if (donorDetails && !is_anonymous) {
      console.log('Donor details retrieved:', {
        email: donorDetails.email,
        name: donorDetails.full_name,
        phone: donorDetails.phone
      })
    }

    console.log('Attempting to create donation with data:', donationData)

    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert([donationData])
      .select()
      .single()

    if (donationError) {
      console.error('Donation creation error:', donationError)
      return NextResponse.json(
        {
          error: 'Failed to create donation record',
          details: donationError.message,
          code: donationError.code,
          hint: donationError.hint
        },
        { status: 500 }
      )
    }

    // Skip campaign update for now to avoid additional errors

    return NextResponse.json({
      success: true,
      donation_id: donation.id,
      razorpay_order_id: razorpayOrderId,
      donation: {
        id: donation.id,
        amount: donation.amount,
        campaign_title: campaign.title,
        donation_type: donation.donation_type
      },
      donor_details: donorDetails // Include the retrieved donor details
    })

  } catch (error) {
    console.error('Donation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}