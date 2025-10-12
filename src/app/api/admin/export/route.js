import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function arrayToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

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
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days')) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let csvData = '';
    let filename = 'report.csv';

    switch (type) {
      case 'users':
        const { data: users } = await supabase
          .from('users')
          .select(`
            id,
            email,
            role,
            created_at,
            profiles (
              full_name,
              phone,
              city,
              state
            )
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        const userHeaders = ['ID', 'Email', 'Full Name', 'Role', 'Phone', 'City', 'State', 'Registration Date'];
        const userData = users?.map(user => ({
          'ID': user.id,
          'Email': user.email,
          'Full Name': user.profiles?.full_name || '',
          'Role': user.role,
          'Phone': user.profiles?.phone || '',
          'City': user.profiles?.city || '',
          'State': user.profiles?.state || '',
          'Registration Date': new Date(user.created_at).toLocaleDateString()
        })) || [];

        csvData = arrayToCSV(userData, userHeaders);
        filename = 'users_report.csv';
        break;

      case 'donations':
        const { data: donations } = await supabase
          .from('donations')
          .select(`
            id,
            amount,
            created_at,
            campaigns (
              title,
              ngos (
                name
              )
            ),
            users (
              email,
              profiles (
                full_name
              )
            )
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        const donationHeaders = ['ID', 'Amount', 'Donor Email', 'Donor Name', 'Campaign', 'NGO', 'Date'];
        const donationData = donations?.map(donation => ({
          'ID': donation.id,
          'Amount': donation.amount,
          'Donor Email': donation.users?.email || '',
          'Donor Name': donation.users?.profiles?.full_name || '',
          'Campaign': donation.campaigns?.title || '',
          'NGO': donation.campaigns?.ngos?.name || '',
          'Date': new Date(donation.created_at).toLocaleDateString()
        })) || [];

        csvData = arrayToCSV(donationData, donationHeaders);
        filename = 'donations_report.csv';
        break;

      case 'campaigns':
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            description,
            goal_amount,
            current_amount,
            status,
            created_at,
            ngos (
              name,
              city,
              state
            )
          `)
          .order('created_at', { ascending: false });

        const campaignHeaders = ['ID', 'Title', 'NGO', 'Goal Amount', 'Current Amount', 'Progress %', 'Status', 'NGO City', 'NGO State', 'Created Date'];
        const campaignData = campaigns?.map(campaign => ({
          'ID': campaign.id,
          'Title': campaign.title,
          'NGO': campaign.ngos?.name || '',
          'Goal Amount': campaign.goal_amount,
          'Current Amount': campaign.current_amount || 0,
          'Progress %': campaign.goal_amount > 0 ? ((campaign.current_amount || 0) / campaign.goal_amount * 100).toFixed(1) : 0,
          'Status': campaign.status,
          'NGO City': campaign.ngos?.city || '',
          'NGO State': campaign.ngos?.state || '',
          'Created Date': new Date(campaign.created_at).toLocaleDateString()
        })) || [];

        csvData = arrayToCSV(campaignData, campaignHeaders);
        filename = 'campaigns_report.csv';
        break;

      case 'geographic':
        const { data: ngos } = await supabase
          .from('ngos')
          .select('id, name, city, state, verification_status, created_at');

        const geoHeaders = ['NGO Name', 'City', 'State', 'Verification Status', 'Registration Date'];
        const geoData = ngos?.map(ngo => ({
          'NGO Name': ngo.name,
          'City': ngo.city || '',
          'State': ngo.state || '',
          'Verification Status': ngo.verification_status,
          'Registration Date': new Date(ngo.created_at).toLocaleDateString()
        })) || [];

        csvData = arrayToCSV(geoData, geoHeaders);
        filename = 'geographic_report.csv';
        break;

      case 'financial':
        const { data: financialData } = await supabase
          .from('donations')
          .select(`
            id,
            amount,
            created_at,
            campaigns (
              title,
              goal_amount,
              ngos (
                name
              )
            )
          `)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        const financialHeaders = ['Transaction ID', 'Amount', 'Campaign', 'NGO', 'Campaign Goal', 'Date', 'Month', 'Year'];
        const financialReportData = financialData?.map(donation => {
          const date = new Date(donation.created_at);
          return {
            'Transaction ID': donation.id,
            'Amount': donation.amount,
            'Campaign': donation.campaigns?.title || '',
            'NGO': donation.campaigns?.ngos?.name || '',
            'Campaign Goal': donation.campaigns?.goal_amount || 0,
            'Date': date.toLocaleDateString(),
            'Month': date.toLocaleDateString('en-US', { month: 'long' }),
            'Year': date.getFullYear()
          };
        }) || [];

        csvData = arrayToCSV(financialReportData, financialHeaders);
        filename = 'financial_report.csv';
        break;

      case 'user-analytics':
        const { data: userAnalytics } = await supabase
          .from('users')
          .select(`
            id,
            email,
            role,
            created_at,
            profiles (
              full_name,
              city,
              state
            )
          `)
          .order('created_at', { ascending: false });

        const analyticsHeaders = ['User ID', 'Email', 'Name', 'Role', 'City', 'State', 'Registration Date', 'Days Since Registration'];
        const analyticsData = userAnalytics?.map(user => {
          const regDate = new Date(user.created_at);
          const daysSince = Math.floor((new Date() - regDate) / (1000 * 60 * 60 * 24));
          return {
            'User ID': user.id,
            'Email': user.email,
            'Name': user.profiles?.full_name || '',
            'Role': user.role,
            'City': user.profiles?.city || '',
            'State': user.profiles?.state || '',
            'Registration Date': regDate.toLocaleDateString(),
            'Days Since Registration': daysSince
          };
        }) || [];

        csvData = arrayToCSV(analyticsData, analyticsHeaders);
        filename = 'user_analytics_report.csv';
        break;

      case 'performance':
        // Combined performance report
        const { data: perfCampaigns } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            goal_amount,
            current_amount,
            status,
            created_at,
            ngos (
              name
            )
          `);

        const { data: perfDonations } = await supabase
          .from('donations')
          .select('campaign_id, amount')
          .gte('created_at', startDate.toISOString());

        const performanceHeaders = ['Campaign ID', 'Campaign Title', 'NGO', 'Goal Amount', 'Raised Amount', 'Success Rate %', 'Donations Count', 'Average Donation', 'Status'];
        const performanceData = perfCampaigns?.map(campaign => {
          const campaignDonations = perfDonations?.filter(d => d.campaign_id === campaign.id) || [];
          const donationCount = campaignDonations.length;
          const avgDonation = donationCount > 0 ? campaignDonations.reduce((sum, d) => sum + d.amount, 0) / donationCount : 0;
          const successRate = campaign.goal_amount > 0 ? ((campaign.current_amount || 0) / campaign.goal_amount * 100) : 0;

          return {
            'Campaign ID': campaign.id,
            'Campaign Title': campaign.title,
            'NGO': campaign.ngos?.name || '',
            'Goal Amount': campaign.goal_amount,
            'Raised Amount': campaign.current_amount || 0,
            'Success Rate %': successRate.toFixed(1),
            'Donations Count': donationCount,
            'Average Donation': Math.round(avgDonation),
            'Status': campaign.status
          };
        }) || [];

        csvData = arrayToCSV(performanceData, performanceHeaders);
        filename = 'performance_report.csv';
        break;

      case 'complete':
        // Generate a comprehensive report with summary statistics
        const { data: allUsers } = await supabase.from('users').select('role, created_at');
        const { data: allDonations } = await supabase.from('donations').select('amount, created_at');
        const { data: allCampaigns } = await supabase.from('campaigns').select('status, goal_amount, current_amount');
        const { data: allNgos } = await supabase.from('ngos').select('verification_status, city, state');

        const summaryHeaders = ['Metric', 'Value', 'Period'];
        const summaryData = [
          { 'Metric': 'Total Users', 'Value': allUsers?.length || 0, 'Period': 'All Time' },
          { 'Metric': 'Total Donors', 'Value': allUsers?.filter(u => u.role === 'donor').length || 0, 'Period': 'All Time' },
          { 'Metric': 'Total Volunteers', 'Value': allUsers?.filter(u => u.role === 'volunteer').length || 0, 'Period': 'All Time' },
          { 'Metric': 'Total NGOs', 'Value': allUsers?.filter(u => u.role === 'ngo').length || 0, 'Period': 'All Time' },
          { 'Metric': 'Verified NGOs', 'Value': allNgos?.filter(n => n.verification_status === 'verified').length || 0, 'Period': 'All Time' },
          { 'Metric': 'Total Donations Amount', 'Value': allDonations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0, 'Period': 'All Time' },
          { 'Metric': 'Total Donations Count', 'Value': allDonations?.length || 0, 'Period': 'All Time' },
          { 'Metric': 'Active Campaigns', 'Value': allCampaigns?.filter(c => c.status === 'active').length || 0, 'Period': 'Current' },
          { 'Metric': 'Completed Campaigns', 'Value': allCampaigns?.filter(c => c.status === 'completed').length || 0, 'Period': 'All Time' },
          { 'Metric': 'Recent Users', 'Value': allUsers?.filter(u => new Date(u.created_at) >= startDate).length || 0, 'Period': `Last ${days} days` },
          { 'Metric': 'Recent Donations', 'Value': allDonations?.filter(d => new Date(d.created_at) >= startDate).length || 0, 'Period': `Last ${days} days` }
        ];

        csvData = arrayToCSV(summaryData, summaryHeaders);
        filename = 'complete_report.csv';
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}