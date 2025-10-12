import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
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

    const body = await request.json();
    const { ngo_id, message } = body;

    // Validate required fields
    if (!ngo_id || !message) {
      return NextResponse.json({ error: 'NGO ID and message are required' }, { status: 400 });
    }

    // Check if volunteer already applied to this NGO
    const { data: existingApplication, error: checkError } = await supabase
      .from('volunteer_applications')
      .select('id')
      .eq('volunteer_id', decoded.userId)
      .eq('ngo_id', ngo_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing application:', checkError);
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 });
    }

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this NGO' }, { status: 400 });
    }

    // Verify NGO exists and is verified
    const { data: ngo, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id, verification_status')
      .eq('id', ngo_id)
      .single();

    if (ngoError || !ngo) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    if (ngo.verification_status !== 'approved') {
      return NextResponse.json({ error: 'NGO is not verified' }, { status: 400 });
    }

    // Create application
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .insert({
        volunteer_id: decoded.userId,
        ngo_id: ngo_id,
        message: message,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Application submitted successfully',
      application 
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}