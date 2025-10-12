import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin role
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', decoded.userId)
      .single();

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overview statistics
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, user_type, created_at');

    if (usersError) throw usersError;

    // Get donations data
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select(`
        id, 
        amount, 
        created_at,
        campaigns (
          id,
          title,
          ngos (
            id,
            name
          )
        )
      `)
      .gte('created_at', startDate.toISOString());

    if (donationsError) throw donationsError;

    // Get campaigns data
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        id,
        title,
        goal_amount,
        current_amount,
        status,
        created_at,
        ngos (
          id,
          name
        )
      `);

    if (campaignsError) throw campaignsError;

    // Get volunteer applications
    const { data: volunteerApps, error: volunteerError } = await supabase
      .from('volunteer_applications')
      .select('id, status, created_at')
      .gte('created_at', startDate.toISOString());

    if (volunteerError) throw volunteerError;

    // Get NGOs data
    const { data: ngos, error: ngosError } = await supabase
      .from('ngos')
      .select('id, name, verification_status, created_at, city, state');

    if (ngosError) throw ngosError;

    // Calculate analytics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // User analytics
    const totalUsers = users.length;
    const donors = users.filter(u => u.user_type === 'donor').length;
    const volunteers = users.filter(u => u.user_type === 'volunteer').length;
    const ngoUsers = users.filter(u => u.user_type === 'ngo').length;

    const recentUsers = users.filter(u => new Date(u.created_at) >= startDate).length;
    const previousUsers = users.filter(u => 
      new Date(u.created_at) >= previousPeriodStart && 
      new Date(u.created_at) < startDate
    ).length;
    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers * 100).toFixed(1) : 0;

    // Donation analytics
    const totalDonationAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const donationCount = donations.length;
    const averageDonation = donationCount > 0 ? totalDonationAmount / donationCount : 0;

    const previousDonations = await supabase
      .from('donations')
      .select('amount')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousDonationAmount = previousDonations.data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const donationGrowth = previousDonationAmount > 0 ? 
      ((totalDonationAmount - previousDonationAmount) / previousDonationAmount * 100).toFixed(1) : 0;

    // Campaign analytics
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const successfulCampaigns = campaigns.filter(c => 
      c.current_amount >= c.goal_amount
    ).length;
    const successRate = campaigns.length > 0 ? 
      ((successfulCampaigns / campaigns.length) * 100).toFixed(1) : 0;

    // Top performing campaigns
    const topCampaign = campaigns
      .sort((a, b) => (b.current_amount || 0) - (a.current_amount || 0))[0];

    // NGO analytics
    const verifiedNgos = ngos.filter(n => n.verification_status === 'verified').length;
    const recentNgos = ngos.filter(n => new Date(n.created_at) >= startDate).length;
    const previousNgos = ngos.filter(n => 
      new Date(n.created_at) >= previousPeriodStart && 
      new Date(n.created_at) < startDate
    ).length;
    const ngoGrowth = previousNgos > 0 ? ((recentNgos - previousNgos) / previousNgos * 100).toFixed(1) : 0;

    // Volunteer analytics
    const totalVolunteerApps = volunteerApps.length;
    const previousVolunteerApps = await supabase
      .from('volunteer_applications')
      .select('id')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());

    const volunteerGrowth = previousVolunteerApps.data?.length > 0 ? 
      ((totalVolunteerApps - previousVolunteerApps.data.length) / previousVolunteerApps.data.length * 100).toFixed(1) : 0;

    // Geographic distribution
    const cityDistribution = ngos.reduce((acc, ngo) => {
      if (ngo.city) {
        acc[ngo.city] = (acc[ngo.city] || 0) + 1;
      }
      return acc;
    }, {});

    const topCities = Object.entries(cityDistribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top performing NGOs
    const ngoPerformance = {};
    donations.forEach(donation => {
      if (donation.campaigns?.ngos?.id) {
        const ngoId = donation.campaigns.ngos.id;
        const ngoName = donation.campaigns.ngos.name;
        if (!ngoPerformance[ngoId]) {
          ngoPerformance[ngoId] = {
            id: ngoId,
            name: ngoName,
            totalDonations: 0,
            campaignCount: 0
          };
        }
        ngoPerformance[ngoId].totalDonations += donation.amount || 0;
      }
    });

    campaigns.forEach(campaign => {
      if (campaign.ngos?.id && ngoPerformance[campaign.ngos.id]) {
        ngoPerformance[campaign.ngos.id].campaignCount++;
      }
    });

    const topPerformers = Object.values(ngoPerformance)
      .sort((a, b) => b.totalDonations - a.totalDonations)
      .slice(0, 10);

    // Recent activity
    const recentActivity = [];
    
    // Add recent donations
    donations.slice(-5).forEach(donation => {
      recentActivity.push({
        type: 'donation',
        description: `New donation of ₹${donation.amount?.toLocaleString()} to ${donation.campaigns?.title || 'campaign'}`,
        timestamp: new Date(donation.created_at).toLocaleDateString()
      });
    });

    // Add recent registrations
    users.filter(u => new Date(u.created_at) >= startDate).slice(-3).forEach(user => {
      recentActivity.push({
        type: 'registration',
        description: `New ${user.user_type} registered`,
        timestamp: new Date(user.created_at).toLocaleDateString()
      });
    });

    // Add recent campaigns
    campaigns.filter(c => new Date(c.created_at) >= startDate).slice(-2).forEach(campaign => {
      recentActivity.push({
        type: 'campaign',
        description: `New campaign "${campaign.title}" created by ${campaign.ngos?.name}`,
        timestamp: new Date(campaign.created_at).toLocaleDateString()
      });
    });

    // Sort by most recent
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const analytics = {
      overview: {
        totalUsers,
        donors,
        volunteers,
        ngos: ngoUsers,
        userGrowth: parseFloat(userGrowth)
      },
      donations: {
        totalAmount: totalDonationAmount,
        count: donationCount,
        average: Math.round(averageDonation),
        growth: parseFloat(donationGrowth),
        topCampaign: topCampaign?.title || 'N/A'
      },
      volunteers: {
        totalApplications: totalVolunteerApps,
        growth: parseFloat(volunteerGrowth)
      },
      ngos: {
        verified: verifiedNgos,
        growth: parseFloat(ngoGrowth),
        topPerformers
      },
      campaigns: {
        active: activeCampaigns,
        completed: completedCampaigns,
        successRate: parseFloat(successRate)
      },
      geographic: {
        topCities
      },
      recentActivity: recentActivity.slice(0, 10)
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}