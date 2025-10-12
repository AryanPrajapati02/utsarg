import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== FIXING DONOR PROFILE LINKS ===')
    
    // First, let's check the current state
    const { data: currentState } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, user_id, full_name, phone, total_donated')
      .order('created_at', { ascending: false })
    
    console.log('Current donor profiles:', currentState)
    
    // Get the authenticated donor user
    const { data: donorUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
      .single()
    
    if (!donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }
    
    console.log('Authenticated donor user:', donorUser)
    
    // Find the profile that should be linked to this user
    // Based on debug data, profile "0ce406d3-892f-4138-90f5-148d733300c1" has donations and should be linked
    const targetProfileId = "0ce406d3-892f-4138-90f5-148d733300c1"
    
    const { data: targetProfile } = await supabaseAdmin
      .from('donor_profiles')
      .select('*')
      .eq('id', targetProfileId)
      .single()
    
    console.log('Target profile:', targetProfile)
    
    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 })
    }
    
    // Check if it's already properly linked
    if (targetProfile.user_id === donorUser.id) {
      console.log('Profile is already properly linked')
      
      // Now check for orphaned profiles that might need to be merged
      const { data: orphanedProfiles } = await supabaseAdmin
        .from('donor_profiles')
        .select('*')
        .is('user_id', null)
      
      console.log('Orphaned profiles found:', orphanedProfiles?.length || 0)
      
      // For each orphaned profile, check if it has donations
      const orphanedWithDonations = []
      for (const orphaned of orphanedProfiles || []) {
        const { data: donations } = await supabaseAdmin
          .from('donations')
          .select('id, amount, created_at')
          .eq('donor_id', orphaned.id)
        
        if (donations && donations.length > 0) {
          orphanedWithDonations.push({
            profile: orphaned,
            donations: donations
          })
        }
      }
      
      console.log('Orphaned profiles with donations:', orphanedWithDonations.length)
      
      // If there are orphaned profiles with donations, we should merge them
      let mergedDonations = 0
      for (const orphanedData of orphanedWithDonations) {
        // Move donations from orphaned profile to the authenticated user's profile
        const { error: updateError } = await supabaseAdmin
          .from('donations')
          .update({ donor_id: targetProfileId })
          .eq('donor_id', orphanedData.profile.id)
        
        if (!updateError) {
          mergedDonations += orphanedData.donations.length
          
          // Update the total_donated in the target profile
          const totalFromOrphaned = orphanedData.donations
            .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
          
          await supabaseAdmin
            .from('donor_profiles')
            .update({ 
              total_donated: (targetProfile.total_donated || 0) + totalFromOrphaned 
            })
            .eq('id', targetProfileId)
          
          // Delete the orphaned profile
          await supabaseAdmin
            .from('donor_profiles')
            .delete()
            .eq('id', orphanedData.profile.id)
          
          console.log(`Merged ${orphanedData.donations.length} donations from orphaned profile ${orphanedData.profile.id}`)
        }
      }
      
      return NextResponse.json({
        message: 'Profile links fixed successfully',
        userAlreadyLinked: true,
        mergedDonations,
        orphanedProfilesProcessed: orphanedWithDonations.length
      })
      
    } else {
      // Link the profile to the user
      const { error: linkError } = await supabaseAdmin
        .from('donor_profiles')
        .update({ user_id: donorUser.id })
        .eq('id', targetProfileId)
      
      if (linkError) {
        console.error('Error linking profile:', linkError)
        return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 })
      }
      
      console.log('Successfully linked profile to user')
      
      return NextResponse.json({
        message: 'Profile linked successfully',
        profileId: targetProfileId,
        userId: donorUser.id
      })
    }

  } catch (error) {
    console.error('Fix error:', error)
    return NextResponse.json({ 
      error: 'Fix failed', 
      details: error.message 
    }, { status: 500 })
  }
}