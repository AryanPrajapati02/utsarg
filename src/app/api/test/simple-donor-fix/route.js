import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check current state
    const { data: profiles } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, user_id, full_name, phone')
    
    const { data: donations } = await supabaseAdmin
      .from('donations')
      .select('id, donor_id, amount')
    
    return NextResponse.json({
      profiles,
      donations,
      summary: {
        totalProfiles: profiles?.length || 0,
        profilesWithUserId: profiles?.filter(p => p.user_id).length || 0,
        profilesWithoutUserId: profiles?.filter(p => !p.user_id).length || 0,
        totalDonations: donations?.length || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Step 1: Get the authenticated donor user
    const { data: donorUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
      .single()
    
    if (!donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }
    
    // Step 2: Find orphaned profiles (user_id is null) that have donations
    const { data: orphanedProfiles } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, phone')
      .is('user_id', null)
    
    const results = []
    
    for (const profile of orphanedProfiles || []) {
      // Check if this profile has donations
      const { data: donations } = await supabaseAdmin
        .from('donations')
        .select('id, amount')
        .eq('donor_id', profile.id)
      
      if (donations && donations.length > 0) {
        // This orphaned profile has donations, let's link it to the authenticated user
        const { error: updateError } = await supabaseAdmin
          .from('donor_profiles')
          .update({ user_id: donorUser.id })
          .eq('id', profile.id)
        
        if (!updateError) {
          results.push({
            profileId: profile.id,
            profileName: profile.full_name,
            donationsCount: donations.length,
            totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
            action: 'linked_to_user'
          })
        }
      }
    }
    
    return NextResponse.json({
      message: 'Donor profiles fixed',
      userId: donorUser.id,
      userEmail: donorUser.email,
      profilesFixed: results
    })
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}