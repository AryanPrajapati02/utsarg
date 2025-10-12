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
    const search = searchParams.get('search');

    let query = supabase
      .from('volunteer_applications')
      .select(`
        *,
        volunteer_user:users!volunteer_applications_volunteer_id_fkey (
          id,
          email,
          volunteer_profiles (
            full_name,
            phone,
            address
          )
        ),
        ngo_profiles (
          ngo_name,
          registered_district,
          registered_state
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`volunteer_user.volunteer_profiles.full_name.ilike.%${search}%,ngo_profiles.ngo_name.ilike.%${search}%`);
    }

    const { data: applications, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching volunteer applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Format applications with all related data
    const formattedApplications = applications.map(app => ({
      ...app,
      volunteer_name: app.volunteer_user?.volunteer_profiles?.[0]?.full_name || 'N/A',
      volunteer_email: app.volunteer_user?.email || 'N/A',
      volunteer_phone: app.volunteer_user?.volunteer_profiles?.[0]?.phone || 'N/A',
      volunteer_location: app.volunteer_user?.volunteer_profiles?.[0]?.address || 'N/A',
      ngo_name: app.ngo_profiles?.ngo_name || 'N/A',
      ngo_location: `${app.ngo_profiles?.registered_district || 'N/A'}, ${app.ngo_profiles?.registered_state || 'N/A'}`
    }));

    // Calculate stats
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'pending').length;
    const approvedApplications = applications.filter(a => a.status === 'approved').length;
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

    const stats = {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications
    };

    return NextResponse.json({ 
      applications: formattedApplications, 
      stats 
    });

  } catch (error) {
    console.error('Admin volunteer applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}