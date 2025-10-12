import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Get the authenticated donor user and their profile
    const { data: donorUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
      .single()

    if (userError || !donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }

    // Get their donor profile
    const { data: donorProfile, error: profileError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, user_id, full_name')
      .eq('user_id', donorUser.id)
      .single()

    if (profileError || !donorProfile) {
      return NextResponse.json({ error: 'No donor profile found for user' }, { status: 404 })
    }

    // Get all donations that are not linked to this profile but might belong to this user
    // We'll look for donations with similar donor names or that were created recently
    const { data: orphanDonations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id, 
        donor_id, 
        amount, 
        payment_status, 
        created_at,
        donor_profiles!donor_id(full_name, user_id)
      `)
      .neq('donor_id', donorProfile.id)
      .eq('payment_status', 'completed')

    if (donationsError) {
      return NextResponse.json({ error: donationsError.message }, { status: 500 })
    }

    // Find donations that might belong to this user (same name or anonymous profiles)
    const donationsToFix = orphanDonations.filter(donation => 
      donation.donor_profiles?.user_id === null && // Anonymous profiles
      (donation.donor_profiles?.full_name === donorProfile.full_name || 
       donation.donor_profiles?.full_name?.toLowerCase().includes(donorProfile.full_name.toLowerCase()))
    )

    if (donationsToFix.length === 0) {
      return NextResponse.json({ 
        message: 'No donations to fix',
        donorUser,
        donorProfile,
        orphanDonations: orphanDonations.length
      })
    }

    // Update these donations to link to the correct donor profile
    const updatePromises = donationsToFix.map(donation =>
      supabaseAdmin
        .from('donations')
        .update({ donor_id: donorProfile.id })
        .eq('id', donation.id)
    )

    const updateResults = await Promise.all(updatePromises)
    const errors = updateResults.filter(result => result.error)

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Some updates failed',
        errors: errors.map(e => e.error.message)
      }, { status: 500 })
    }

    // Calculate total donated and update donor profile
    const { data: allDonations } = await supabaseAdmin
      .from('donations')
      .select('amount')
      .eq('donor_id', donorProfile.id)
      .eq('payment_status', 'completed')

    const totalDonated = allDonations?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0

    await supabaseAdmin
      .from('donor_profiles')
      .update({ total_donated: totalDonated })
      .eq('id', donorProfile.id)

    return NextResponse.json({
      message: 'Successfully fixed donor donations',
      donorUser,
      donorProfile,
      donationsFixed: donationsToFix.length,
      totalDonated,
      fixedDonations: donationsToFix.map(d => ({
        id: d.id,
        amount: d.amount,
        oldDonorId: d.donor_id,
        newDonorId: donorProfile.id
      }))
    })

  } catch (error) {
    console.error('Fix donor donations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}