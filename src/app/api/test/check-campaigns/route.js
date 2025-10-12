import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Check campaigns table
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch campaigns',
        details: campaignsError.message 
      }, { status: 500 });
    }

    // Check NGO profiles table
    const { data: ngos, error: ngosError } = await supabase
      .from('ngo_profiles')
      .select('*');

    if (ngosError) {
      return NextResponse.json({ 
        error: 'Failed to fetch NGO profiles',
        details: ngosError.message 
      }, { status: 500 });
    }

    // Check donations table
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*');

    if (donationsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch donations',
        details: donationsError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Database check complete',
      campaigns: {
        count: campaigns.length,
        data: campaigns
      },
      ngos: {
        count: ngos.length,
        data: ngos.map(ngo => ({
          id: ngo.id,
          ngo_name: ngo.ngo_name,
          verification_status: ngo.verification_status,
          created_at: ngo.created_at
        }))
      },
      donations: {
        count: donations.length,
        data: donations.map(donation => ({
          id: donation.id,
          amount: donation.amount,
          payment_status: donation.payment_status,
          created_at: donation.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}