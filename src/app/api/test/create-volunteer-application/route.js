import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { volunteerEmail, ngoId, message } = await request.json();

    // Find volunteer user
    const { data: volunteerUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', volunteerEmail)
      .eq('user_type', 'volunteer')
      .single();

    if (userError || !volunteerUser) {
      return NextResponse.json({ error: 'Volunteer user not found' }, { status: 404 });
    }

    // Create volunteer application
    const { data: application, error: appError } = await supabase
      .from('volunteer_applications')
      .insert({
        volunteer_id: volunteerUser.id,
        ngo_id: ngoId,
        message: message || 'I would like to volunteer with your organization.',
        status: 'pending'
      })
      .select()
      .single();

    if (appError) {
      console.error('Error creating volunteer application:', appError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Volunteer application created successfully',
      application
    });

  } catch (error) {
    console.error('Create volunteer application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get all NGOs for testing
    const { data: ngos, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id, ngo_name, user_id')
      .limit(5);

    // Get all volunteer users for testing
    const { data: volunteers, error: volError } = await supabase
      .from('users')
      .select('id, email')
      .eq('user_type', 'volunteer')
      .limit(5);

    return NextResponse.json({
      message: 'Available data for testing',
      ngos: ngos || [],
      volunteers: volunteers || []
    });

  } catch (error) {
    console.error('Get test data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}