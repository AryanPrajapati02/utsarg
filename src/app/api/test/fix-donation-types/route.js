import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Get all donations with their campaign types
    const { data: donations, error: donationsError } = await supabaseAdmin
      .from('donations')
      .select(`
        id,
        donation_type,
        campaign_id,
        campaigns!campaign_id(campaign_type)
      `)

    if (donationsError) {
      return NextResponse.json({ error: donationsError.message }, { status: 500 })
    }

    // Find donations where donation_type doesn't match campaign_type
    const donationsToFix = donations.filter(donation => 
      donation.campaigns?.campaign_type && 
      donation.donation_type !== donation.campaigns.campaign_type
    )

    if (donationsToFix.length === 0) {
      return NextResponse.json({ 
        message: 'No donation types to fix',
        totalDonations: donations.length,
        correctTypes: donations.length - donationsToFix.length
      })
    }

    // Update donation types to match campaign types
    const updatePromises = donationsToFix.map(donation =>
      supabaseAdmin
        .from('donations')
        .update({ donation_type: donation.campaigns.campaign_type })
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

    return NextResponse.json({
      message: 'Successfully fixed donation types',
      donationsFixed: donationsToFix.length,
      fixedDonations: donationsToFix.map(d => ({
        id: d.id,
        oldType: d.donation_type,
        newType: d.campaigns.campaign_type,
        campaignId: d.campaign_id
      }))
    })

  } catch (error) {
    console.error('Fix donation types error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}