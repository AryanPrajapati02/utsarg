import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log('Admin NGO user lookup API called for ID:', id);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded successfully for user:', decoded.userId);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type, email')
      .eq('id', decoded.userId)
      .single();

    if (userError) {
      console.log('User lookup error:', userError);
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    }

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.user_type !== 'super_admin') {
      console.log('Access denied for user type:', user.user_type);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get NGO details
    const { data: ngo, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select(`
        *,
        users!inner(id, email, created_at, is_verified)
      `)
      .eq('id', id)
      .single();

    if (ngoError) {
      console.log('NGO lookup error:', ngoError);
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    if (!ngo) {
      console.log('NGO not found for ID:', id);
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    // Format NGO data
    const ngoData = {
      id: ngo.id,
      user_id: ngo.user_id,
      name: ngo.ngo_name,
      email: ngo.users.email,
      phone: ngo.phone,
      user_type: 'ngo',
      created_at: ngo.users.created_at,
      is_verified: ngo.users.is_verified,
      verification_status: ngo.verification_status,
      darpan_id: ngo.darpan_id,
      npo_type: ngo.npo_type,
      registered_state: ngo.registered_state,
      registered_district: ngo.registered_district,
      contact_person: ngo.contact_person,
      website: ngo.website,
      address: ngo.address,
      description: ngo.description
    };

    console.log('NGO found:', ngoData.name);
    return NextResponse.json({ ngo: ngoData });

  } catch (error) {
    console.error('Admin NGO user lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    console.log('Admin NGO user update API called for ID:', id);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user || user.user_type !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = await request.json();
    
    // Update NGO profile
    const { data: updatedNgo, error: updateError } = await supabase
      .from('ngo_profiles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users!inner(id, email, created_at, is_verified)
      `)
      .single();

    if (updateError) {
      console.log('NGO update error:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    console.log('NGO updated successfully:', updatedNgo.ngo_name);
    return NextResponse.json({ 
      message: 'NGO updated successfully',
      ngo: updatedNgo
    });

  } catch (error) {
    console.error('Admin NGO user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}