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

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    let query = supabase
      .from('ngo_profiles')
      .select('id, ngo_name, description, registered_district, registered_state, phone')
      .eq('verification_status', 'approved');

    // Apply filters
    if (city) {
      query = query.ilike('registered_district', `%${city}%`);
    }
    if (state) {
      query = query.ilike('registered_state', `%${state}%`);
    }

    const { data: opportunities, error } = await query.order('ngo_name');

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
    }

    return NextResponse.json({ opportunities });

  } catch (error) {
    console.error('Opportunities fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}