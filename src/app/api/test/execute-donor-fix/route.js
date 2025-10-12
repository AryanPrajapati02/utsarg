import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== EXECUTING DONOR PROFILE FIX ===')
    
    // Step 1: Get the authenticated donor user
    const { data: donorUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('user_type', 'donor')
    
    if (userError || !donorUsers || donorUsers.length === 0) {
      return NextResponse.json({ error: 'No donor users found' }, { status: 404 })
    }
    
    // For now, use the first donor user (in production, you'd be more specific)
    const targetUser = donorUsers[0]
    console.log('Target user:', targetUser)
    
    // Step 2: Find orphaned profiles that have donations
    const { data: orphanedProfiles, error: orphanedError } = await supabaseAdmin
      .from('donor_profiles')
      .select('id, full_name, phone')
      .is('user_id', null)
    
    if (orphanedError) {
      return NextResponse.json({ error: 'Failed to fetch orphaned profiles' }, { status: 500 })
    }
    
    console.log('Found orphaned profiles:', orphanedProfiles?.length || 0)
    
    const profilesWithDonations = []
    
    // Step 3: Check which orphaned profiles have donations
    for (const profile of orphanedProfiles || []) {
      const { data: donations } = await supabaseAdmin
        .from('donations')
        .select('id, amount, created_at')
        .eq('donor_id', profile.id)
      
      if (donations && donations.length > 0) {
        profilesWithDonations.push({
          ...profile,
          donationCount: donations.length,
          totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
        })
      }
    }
    
    console.log('Orphaned profiles with donations:', profilesWithDonations.length)
    
    // Step 4: Link these profiles to the authenticated user
    const fixedProfiles = []
    
    for (const profile of profilesWithDonations) {
      const { error: updateError } = await supabaseAdmin
        .from('donor_profiles')
        .update({ user_id: targetUser.id })
        .eq('id', profile.id)
      
      if (!updateError) {
        fixedProfiles.push(profile)
        console.log(`Linked profile ${profile.id} (${profile.full_name}) to user ${targetUser.id}`)
      } else {
        console.error(`Failed to link profile ${profile.id}:`, updateError)
      }
    }
    
    // Step 5: Update total_donated for the user's main profile
    if (fixedProfiles.length > 0) {
      const totalFromFixed = fixedProfiles.reduce((sum, p) => sum + p.totalAmount, 0)
      
      // Find the user's main profile (if any)
      const { data: mainProfile } = await supabaseAdmin
        .from('donor_profiles')
        .select('id, total_donated')
        .eq('user_id', targetUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (mainProfile) {
        await supabaseAdmin
          .from('donor_profiles')
          .update({ 
            total_donated: (mainProfile.total_donated || 0) + totalFromFixed 
          })
          .eq('id', mainProfile.id)
        
        console.log(`Updated main profile total_donated by ${totalFromFixed}`)
      }
    }
    
    return NextResponse.json({
      message: 'Donor profile fix completed successfully',
      targetUser: {
        id: targetUser.id,
        email: targetUser.email
      },
      orphanedProfilesFound: orphanedProfiles?.length || 0,
      profilesWithDonations: profilesWithDonations.length,
      profilesFixed: fixedProfiles.length,
      fixedProfiles: fixedProfiles.map(p => ({
        id: p.id,
        name: p.full_name,
        donationCount: p.donationCount,
        totalAmount: p.totalAmount
      }))
    })

  } catch (error) {
    console.error('Fix execution error:', error)
    return NextResponse.json({ 
      error: 'Fix execution failed', 
      details: error.message 
    }, { status: 500 })
  }
}