import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== MANUAL PROFILE FIX ===')
    
    // Step 1: Get the authenticated donor user
    const { data: donorUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
      .single()
    
    if (userError || !donorUser) {
      return NextResponse.json({ error: 'No donor user found' }, { status: 404 })
    }
    
    console.log('Found donor user:', donorUser)
    
    // Step 2: Check current donor profiles
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, user_id, full_name, phone, total_donated')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }
    
    console.log('All profiles:', allProfiles)
    
    // Step 3: Find the profile that should be linked to this user
    // Based on our previous debug, profile "0ce406d3-892f-4138-90f5-148d733300c1" has the donations
    const targetProfileId = "0ce406d3-892f-4138-90f5-148d733300c1"
    const targetProfile = allProfiles.find(p => p.id === targetProfileId)
    
    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 })
    }
    
    console.log('Target profile:', targetProfile)
    
    // Step 4: Check donations for this profile
    const { data: profileDonations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select('id, amount, payment_status, created_at')
      .eq('donor_id', targetProfileId)
    
    if (donationsError) {
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
    }
    
    console.log('Profile donations:', profileDonations?.length || 0)
    
    // Step 5: Link the profile to the user if not already linked
    if (targetProfile.user_id !== donorUser.id) {
      const { error: updateError } = await supabaseAdmin
        .from('donor_profiles')
        .update({ user_id: donorUser.id })
        .eq('id', targetProfileId)
      
      if (updateError) {
        return NextResponse.json({ error: 'Failed to link profile' }, { status: 500 })
      }
      
      console.log('Successfully linked profile to user')
    } else {
      console.log('Profile already linked to user')
    }
    
    // Step 6: Clean up any orphaned profiles with no donations
    const orphanedProfiles = allProfiles.filter(p => !p.user_id && p.id !== targetProfileId)
    const cleanedUp = []
    
    for (const orphaned of orphanedProfiles) {
      const { data: orphanedDonations } = await supabaseAdmin
        .from('donations')
        .select('id')
        .eq('donor_id', orphaned.id)
      
      if (!orphanedDonations || orphanedDonations.length === 0) {
        // Safe to delete - no donations
        const { error: deleteError } = await supabaseAdmin
          .from('donor_profiles')
          .delete()
          .eq('id', orphaned.id)
        
        if (!deleteError) {
          cleanedUp.push(orphaned.id)
          console.log('Deleted orphaned profile:', orphaned.id)
        }
      }
    }
    
    return NextResponse.json({
      message: 'Manual profile fix completed',
      donorUser,
      targetProfile,
      donationsCount: profileDonations?.length || 0,
      profileLinked: targetProfile.user_id === donorUser.id,
      orphanedProfilesCleaned: cleanedUp.length,
      cleanedUpProfiles: cleanedUp
    })

  } catch (error) {
    console.error('Manual fix error:', error)
    return NextResponse.json({ 
      error: 'Manual fix failed', 
      details: error.message 
    }, { status: 500 })
  }
}