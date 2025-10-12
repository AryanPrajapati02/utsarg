import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== FIXING ORPHANED DONOR PROFILES ===')
    
    // Get all donor profiles with null user_id
    const { data: orphanedProfiles, error: orphanedError } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
      .is('user_id', null)
    
    if (orphanedError) {
      console.error('Error fetching orphaned profiles:', orphanedError)
      return NextResponse.json({ error: 'Failed to fetch orphaned profiles' }, { status: 500 })
    }
    
    console.log('Found orphaned profiles:', orphanedProfiles?.length || 0)
    
    // Get all authenticated donor users
    const { data: donorUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'donor')
    
    if (usersError) {
      console.error('Error fetching donor users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch donor users' }, { status: 500 })
    }
    
    console.log('Found donor users:', donorUsers?.length || 0)
    
    // Get existing linked donor profiles
    const { data: linkedProfiles, error: linkedError } = await supabaseAdmin
      .from('donor_profiles')
      .select('user_id, full_name, phone')
      .not('user_id', 'is', null)
    
    if (linkedError) {
      console.error('Error fetching linked profiles:', linkedError)
      return NextResponse.json({ error: 'Failed to fetch linked profiles' }, { status: 500 })
    }
    
    console.log('Found linked profiles:', linkedProfiles?.length || 0)
    
    const fixes = []
    const merges = []
    
    // For each orphaned profile, try to find a matching authenticated user
    for (const orphaned of orphanedProfiles || []) {
      console.log(`Processing orphaned profile: ${orphaned.full_name} (${orphaned.phone})`)
      
      // Check if there's already a linked profile with the same name and phone
      const matchingLinked = linkedProfiles?.find(linked => 
        linked.full_name === orphaned.full_name && 
        linked.phone === orphaned.phone
      )
      
      if (matchingLinked) {
        console.log(`Found matching linked profile for ${orphaned.full_name}`)
        
        // We need to merge the orphaned profile's donations into the linked profile
        const { data: orphanedDonations } = await supabaseAdmin
          .from('donations')
          .select('id')
          .eq('donor_id', orphaned.id)
        
        if (orphanedDonations && orphanedDonations.length > 0) {
          // Update donations to point to the linked profile
          const { error: updateError } = await supabaseAdmin
            .from('donations')
            .update({ donor_id: matchingLinked.user_id })
            .eq('donor_id', orphaned.id)
          
          if (!updateError) {
            // Delete the orphaned profile
            await supabaseAdmin
              .from('donor_profiles')
              .delete()
              .eq('id', orphaned.id)
            
            merges.push({
              orphanedProfile: orphaned.id,
              mergedInto: matchingLinked.user_id,
              donationsMoved: orphanedDonations.length
            })
            
            console.log(`Merged ${orphanedDonations.length} donations from orphaned profile to linked profile`)
          }
        }
      } else {
        // Try to find a donor user that could match this orphaned profile
        // For now, we'll create a simple API to manually link them
        console.log(`No automatic match found for ${orphaned.full_name}`)
      }
    }
    
    // Also fix the specific case where we know the user
    // Based on the debug data, user "3e22aef4-d5d1-480f-afc7-5a60da114bd6" should be linked to profile "0ce406d3-892f-4138-90f5-148d733300c1"
    const knownUserId = "3e22aef4-d5d1-480f-afc7-5a60da114bd6"
    const knownProfileId = "0ce406d3-892f-4138-90f5-148d733300c1"
    
    // Check if this profile exists and is properly linked
    const { data: knownProfile } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
      .eq('id', knownProfileId)
      .single()
    
    if (knownProfile && knownProfile.user_id === knownUserId) {
      console.log('Known profile is already properly linked')
    } else if (knownProfile) {
      console.log('Fixing known profile link')
      const { error: fixError } = await supabaseAdmin
        .from('donor_profiles')
        .update({ user_id: knownUserId })
        .eq('id', knownProfileId)
      
      if (!fixError) {
        fixes.push({
          profileId: knownProfileId,
          userId: knownUserId,
          action: 'linked'
        })
      }
    }

    return NextResponse.json({
      message: 'Orphaned profiles processing completed',
      orphanedProfilesFound: orphanedProfiles?.length || 0,
      donorUsersFound: donorUsers?.length || 0,
      linkedProfilesFound: linkedProfiles?.length || 0,
      fixes,
      merges
    })

  } catch (error) {
    console.error('Fix error:', error)
    return NextResponse.json({ 
      error: 'Fix failed', 
      details: error.message 
    }, { status: 500 })
  }
}