import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    console.log('=== CREATING SAMPLE VOLUNTEERS ===');
    
    const sampleVolunteers = [
      {
        email: 'volunteer1@example.com',
        password: 'password123',
        profile: {
          full_name: 'John Doe',
          phone: '+91-9876543210',
          address: '123 Main Street, Delhi',
          skills: ['Teaching', 'Event Management', 'Social Media'],
          availability: { weekdays: true, weekends: true, hours: 'flexible' },
          experience: '2 years of volunteering with local NGOs'
        }
      },
      {
        email: 'volunteer2@example.com',
        password: 'password123',
        profile: {
          full_name: 'Jane Smith',
          phone: '+91-9876543211',
          address: '456 Park Avenue, Mumbai',
          skills: ['Healthcare', 'Counseling', 'First Aid'],
          availability: { weekdays: false, weekends: true, hours: 'mornings' },
          experience: 'Medical student with volunteer experience'
        }
      },
      {
        email: 'volunteer3@example.com',
        password: 'password123',
        profile: {
          full_name: 'Raj Patel',
          phone: '+91-9876543212',
          address: '789 Tech Park, Bangalore',
          skills: ['Web Development', 'Digital Marketing', 'Photography'],
          availability: { weekdays: true, weekends: false, hours: 'evenings' },
          experience: 'Tech professional interested in social causes'
        }
      }
    ];

    const results = [];

    for (const volunteerData of sampleVolunteers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', volunteerData.email)
          .single();

        if (existingUser) {
          results.push({
            email: volunteerData.email,
            status: 'skipped',
            reason: 'User already exists'
          });
          continue;
        }

        // Create user
        const hashedPassword = await hashPassword(volunteerData.password);
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: volunteerData.email,
            password_hash: hashedPassword,
            user_type: 'volunteer',
            is_verified: true,
            is_approved: true
          })
          .select()
          .single();

        if (userError) {
          results.push({
            email: volunteerData.email,
            status: 'failed',
            error: userError.message
          });
          continue;
        }

        // Create volunteer profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('volunteer_profiles')
          .insert({
            user_id: user.id,
            ...volunteerData.profile
          })
          .select()
          .single();

        if (profileError) {
          // Clean up user if profile creation failed
          await supabaseAdmin.from('users').delete().eq('id', user.id);
          results.push({
            email: volunteerData.email,
            status: 'failed',
            error: profileError.message
          });
          continue;
        }

        results.push({
          email: volunteerData.email,
          status: 'created',
          userId: user.id,
          profileId: profile.id
        });

      } catch (error) {
        results.push({
          email: volunteerData.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // Get final count
    const { data: allVolunteers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('user_type', 'volunteer');

    console.log('Sample volunteers creation completed');
    console.log('Results:', results);

    return NextResponse.json({
      message: 'Sample volunteers creation completed',
      results,
      totalVolunteersNow: allVolunteers?.length || 0
    });

  } catch (error) {
    console.error('Create sample volunteers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}