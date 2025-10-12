import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin or super_admin
    if (decoded.userType !== 'admin' && decoded.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    let query = supabaseAdmin
      .from('donations')
      .select(`
        *,
        donor_profiles (full_name, user_id, users (email)),
        campaigns (title, ngo_profiles (ngo_name))
      `);

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    const { data: donations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
    }

    // Format donations with related data
    const formattedDonations = donations.map(donation => ({
      ...donation,
      donor_name: donation.donor_profiles?.full_name || donation.donor_name,
      donor_email: donation.donor_profiles?.users?.email || donation.donor_email,
      ngo_name: donation.campaigns?.ngo_profiles?.ngo_name,
      campaign_title: donation.campaigns?.title
    }));

    // Calculate stats
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = donations
      .filter(d => {
        const donationDate = new Date(d.created_at);
        return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + d.amount, 0);
    
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const stats = {
      totalDonations,
      totalAmount,
      thisMonth,
      averageDonation
    };

    return NextResponse.json({ donations: formattedDonations, stats });

  } catch (error) {
    console.error('Admin donations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}