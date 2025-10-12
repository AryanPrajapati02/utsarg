import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== DONOR DASHBOARD DEBUG ===')
    
    // Check all users with donor type
    const { data: donorUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'donor')
    
    console.log('Donor users:', donorUsers)
    
    // Check all donor profiles
    const { data: donorProfiles, error: profilesError } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
    
    console.log('Donor profiles:', donorProfiles)
    
    // Check all donations
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        donor_id,
        campaign_id,
        amount,
        donation_type,
        payment_status,
        created_at,
        campaigns(id, title)
      `)
      .order('created_at', { ascending: false })
    
    console.log('All donations:', donations)
    
    // Check for orphaned donations (donations without matching donor profiles)
    const donorProfileIds = donorProfiles?.map(p => p.id) || []
    const orphanedDonations = donations?.filter(d => !donorProfileIds.includes(d.donor_id)) || []
    
    console.log('Orphaned donations:', orphanedDonations)
    
    // Check for donations with null donor_id
    const nullDonorDonations = donations?.filter(d => !d.donor_id) || []
    
    console.log('Donations with null donor_id:', nullDonorDonations)
    
    // For each donor profile, check their donations
    const donorDonationMap = {}
    if (donorProfiles) {
      for (const profile of donorProfiles) {
        const profileDonations = donations?.filter(d => d.donor_id === profile.id) || []
        donorDonationMap[profile.id] = {
          profile,
          donations: profileDonations,
          donationCount: profileDonations.length,
          totalAmount: profileDonations
            .filter(d => d.payment_status === 'completed')
            .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
        }
      }
    }
    
    console.log('Donor donation mapping:', donorDonationMap)

    return NextResponse.json({
      summary: {
        donorUsersCount: donorUsers?.length || 0,
        donorProfilesCount: donorProfiles?.length || 0,
        totalDonationsCount: donations?.length || 0,
        orphanedDonationsCount: orphanedDonations.length,
        nullDonorDonationsCount: nullDonorDonations.length
      },
      donorUsers,
      donorProfiles,
      donations,
      orphanedDonations,
      nullDonorDonations,
      donorDonationMap
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}