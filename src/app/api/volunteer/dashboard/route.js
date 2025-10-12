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
    
    console.log('Volunteer Dashboard - JWT Debug:', {
      userId: decoded.userId,
      email: decoded.email,
      user_type: decoded.user_type,
      userType: decoded.userType,
      isVerified: decoded.isVerified,
      isApproved: decoded.isApproved
    });
    
    // Check both userType and user_type for backward compatibility
    const userType = decoded.userType || decoded.user_type;
    
    if (userType !== 'volunteer') {
      console.log('Access denied - userType is:', userType, 'expected: volunteer');
      console.log('Token debug:', {
        userType: decoded.userType,
        user_type: decoded.user_type,
        finalUserType: userType
      });
      return NextResponse.json({ 
        error: 'Access denied',
        debug: {
          userType: decoded.userType,
          user_type: decoded.user_type,
          finalUserType: userType,
          expected: 'volunteer'
        }
      }, { status: 403 });
    }

    // Get volunteer stats
    const { data: applications, error: appsError } = await supabase
      .from('volunteer_applications')
      .select('*')
      .eq('volunteer_id', decoded.userId);

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    const stats = {
      activeApplications: applications.filter(app => app.status === 'pending').length,
      approvedApplications: applications.filter(app => app.status === 'approved').length,
      hoursVolunteered: 0 // This would be calculated from actual volunteer hours tracking
    };

    // Get recent applications with NGO details
    const { data: recentApplications, error: recentError } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        ngo_profiles (ngo_name, registered_district, registered_state)
      `)
      .eq('volunteer_id', decoded.userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error fetching recent applications:', recentError);
      return NextResponse.json({ error: 'Failed to fetch recent applications' }, { status: 500 });
    }

    // Format recent applications
    const formattedRecentApplications = recentApplications.map(app => ({
      ...app,
      ngo_name: app.ngo_profiles?.ngo_name,
      ngo_city: app.ngo_profiles?.registered_district,
      ngo_state: app.ngo_profiles?.registered_state
    }));

    // Get available opportunities (verified NGOs)
    const { data: availableOpportunities, error: opportunitiesError } = await supabase
      .from('ngo_profiles')
      .select('id, ngo_name, description, registered_district, registered_state')
      .eq('verification_status', 'approved')
      .limit(6);

    if (opportunitiesError) {
      console.error('Error fetching opportunities:', opportunitiesError);
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
    }

    return NextResponse.json({
      stats,
      recentApplications: formattedRecentApplications,
      availableOpportunities
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}