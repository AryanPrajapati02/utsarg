import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Get all donor profiles that have no user_id and no donations linked to them
    const { data: orphanProfiles, error: profilesError } = await supabaseAdmin
      .from('donor_profiles')
      .select(`
        id, 
        full_name, 
        user_id,
        donations(id)
      `)
      .is('user_id', null)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Filter profiles that have no donations
    const profilesToDelete = orphanProfiles.filter(profile => 
      !profile.donations || profile.donations.length === 0
    )

    if (profilesToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No orphan profiles to clean up',
        orphanProfiles: orphanProfiles.length,
        profilesWithDonations: orphanProfiles.filter(p => p.donations && p.donations.length > 0).length
      })
    }

    // Delete the orphan profiles
    const deletePromises = profilesToDelete.map(profile =>
      supabaseAdmin
        .from('donor_profiles')
        .delete()
        .eq('id', profile.id)
    )

    const deleteResults = await Promise.all(deletePromises)
    const errors = deleteResults.filter(result => result.error)

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Some deletions failed',
        errors: errors.map(e => e.error.message)
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully cleaned up orphan profiles',
      deletedProfiles: profilesToDelete.length,
      deletedProfileIds: profilesToDelete.map(p => p.id),
      remainingOrphanProfiles: orphanProfiles.length - profilesToDelete.length
    })

  } catch (error) {
    console.error('Cleanup orphan profiles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}