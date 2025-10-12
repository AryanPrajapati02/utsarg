import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType !== 'admin' && decoded.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const ngo = searchParams.get('ngo');
    const search = searchParams.get('search');

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        ngo:ngo_profiles (
          id,
          ngo_name
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (ngo) {
      query = query.ilike('ngo.ngo_name', `%${ngo}%`);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Format campaigns with NGO data and field mapping
    const formattedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      ngo_name: campaign.ngo?.ngo_name,
      goal_amount: campaign.target_amount || 0,
      amount_raised: campaign.raised_amount || 0
    }));

    // Calculate stats
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
    const averageGoal = totalCampaigns > 0 
      ? campaigns.reduce((sum, c) => sum + (c.target_amount || 0), 0) / totalCampaigns 
      : 0;

    const stats = {
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      averageGoal
    };

    return NextResponse.json({ campaigns: formattedCampaigns, stats });

  } catch (error) {
    console.error('Admin campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}