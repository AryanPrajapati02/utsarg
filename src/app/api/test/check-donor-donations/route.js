import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all donations with their donor_id
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select('id, donor_id, amount, payment_status, created_at')
      .order('created_at', { ascending: false })

    if (donationsError) {
      return NextResponse.json({ error: donationsError.message }, { status: 500 })
    }

    // Get all donor profiles
    const { data: donorProfiles, error: profilesError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, user_id, full_name')

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Check which donations have matching donor profiles
    const donationsWithProfiles = donations.map(donation => {
      const profile = donorProfiles.find(p => p.id === donation.donor_id)
      return {
        donation_id: donation.id,
        donor_id: donation.donor_id,
        amount: donation.amount,
        payment_status: donation.payment_status,
        created_at: donation.created_at,
        profile_found: !!profile,
        profile_name: profile?.full_name,
        profile_user_id: profile?.user_id
      }
    })

    // Get users to see if they exist
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'donor')

    return NextResponse.json({
      donations: donationsWithProfiles,
      donorProfiles: donorProfiles,
      donorUsers: users,
      summary: {
        totalDonations: donations.length,
        donationsWithProfiles: donationsWithProfiles.filter(d => d.profile_found).length,
        donationsWithoutProfiles: donationsWithProfiles.filter(d => !d.profile_found).length,
        totalDonorProfiles: donorProfiles.length,
        totalDonorUsers: users?.length || 0
      }
    })

  } catch (error) {
    console.error('Check donor donations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}