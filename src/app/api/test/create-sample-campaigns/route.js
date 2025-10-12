import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    // First, check if there are any approved NGOs
    const { data: ngos, error: ngosError } = await supabase
      .from('ngo_profiles')
      .select('id, ngo_name')
      .eq('verification_status', 'approved')
      .limit(3);

    if (ngosError) {
      return NextResponse.json({ 
        error: 'Failed to fetch NGOs',
        details: ngosError.message 
      }, { status: 500 });
    }

    if (!ngos || ngos.length === 0) {
      return NextResponse.json({ 
        error: 'No approved NGOs found. Create and approve some NGOs first.',
        hint: 'Use /api/test/create-sample-ngo to create sample NGOs'
      }, { status: 400 });
    }

    // Create sample campaigns
    const sampleCampaigns = [
      {
        ngo_id: ngos[0].id,
        title: 'Education for Underprivileged Children',
        description: 'Help us provide quality education to children from low-income families. Your donation will help us buy books, stationery, and pay teacher salaries.',
        category: 'Education',
        campaign_type: 'money',
        target_amount: 100000,
        raised_amount: 25000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        location: 'Mumbai, Maharashtra',
        status: 'active'
      },
      {
        ngo_id: ngos[0].id,
        title: 'Clean Water Initiative',
        description: 'Providing clean drinking water to rural communities. Help us install water purification systems in remote villages.',
        category: 'Health',
        campaign_type: 'money',
        target_amount: 200000,
        raised_amount: 75000,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        location: 'Rajasthan',
        status: 'active'
      }
    ];

    // Add more campaigns if we have more NGOs
    if (ngos.length > 1) {
      sampleCampaigns.push({
        ngo_id: ngos[1].id,
        title: 'Food Distribution Drive',
        description: 'Monthly food distribution to homeless and needy families. Help us provide nutritious meals to those who need it most.',
        category: 'Food Security',
        campaign_type: 'food',
        target_items: 1000,
        collected_items: 300,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now
        location: 'Delhi',
        status: 'active'
      });
    }

    if (ngos.length > 2) {
      sampleCampaigns.push({
        ngo_id: ngos[2].id,
        title: 'Winter Clothing Drive',
        description: 'Collecting warm clothes for the homeless during winter season. Donate blankets, jackets, and warm clothing.',
        category: 'Social Welfare',
        campaign_type: 'clothes',
        target_items: 500,
        collected_items: 150,
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
        end_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days from now
        location: 'Chandigarh',
        status: 'active'
      });
    }

    // Insert campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .insert(sampleCampaigns)
      .select();

    if (campaignsError) {
      return NextResponse.json({ 
        error: 'Failed to create campaigns',
        details: campaignsError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Sample campaigns created successfully',
      campaigns: campaigns,
      ngosUsed: ngos.map(ngo => ({ id: ngo.id, name: ngo.ngo_name }))
    });

  } catch (error) {
    console.error('Create sample campaigns error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}