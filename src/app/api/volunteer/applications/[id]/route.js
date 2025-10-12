import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

    const { id: applicationId } = await params;

    // Fetch the application with NGO details
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        ngo_profiles (
          id,
          ngo_name,
          description,
          registered_district,
          registered_state,
          phone,
          contact_person
        )
      `)
      .eq('id', applicationId)
      .eq('volunteer_id', decoded.userId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
    }

    // Format the response
    const formattedApplication = {
      ...application,
      ngo_name: application.ngo_profiles?.ngo_name,
      ngo_description: application.ngo_profiles?.description,
      ngo_city: application.ngo_profiles?.registered_district,
      ngo_state: application.ngo_profiles?.registered_state,
      ngo_phone: application.ngo_profiles?.phone,
      ngo_contact: application.ngo_profiles?.contact_person
    };

    // Remove the nested object to avoid duplication
    delete formattedApplication.ngo_profiles;

    return NextResponse.json({ application: formattedApplication });

  } catch (error) {
    console.error('Volunteer application detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}