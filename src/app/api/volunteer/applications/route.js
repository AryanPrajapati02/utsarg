import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userType = decoded.userType || decoded.user_type;
    if (userType !== 'volunteer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        ngo_profiles (ngo_name, registered_district, registered_state, phone)
      `)
      .eq('volunteer_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Format applications with NGO details
    const formattedApplications = applications.map(app => ({
      ...app,
      ngo_name: app.ngo_profiles?.ngo_name,
      ngo_city: app.ngo_profiles?.registered_district,
      ngo_state: app.ngo_profiles?.registered_state,
      ngo_phone: app.ngo_profiles?.phone
    }));

    return NextResponse.json({ applications: formattedApplications });

  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}