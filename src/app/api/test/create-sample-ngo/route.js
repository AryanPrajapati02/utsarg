import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const sampleNGOs = [
      {
        email: 'ngo1@test.com',
        password: 'password123',
        ngo_name: 'Hope Foundation',
        darpan_id: 'HR/2023/0001234',
        npo_type: 'Trust',
        registered_state: 'Haryana',
        registered_district: 'Gurgaon',
        description: 'Working towards education and healthcare for underprivileged communities.',
        contact_person: 'Rajesh Kumar',
        phone: '9876543210',
        address: '123 Sector 14, Gurgaon, Haryana',
        website: 'https://hopefoundation.org'
      },
      {
        email: 'ngo2@test.com',
        password: 'password123',
        ngo_name: 'Green Earth Initiative',
        darpan_id: 'MH/2023/0005678',
        npo_type: 'Society',
        registered_state: 'Maharashtra',
        registered_district: 'Mumbai',
        description: 'Environmental conservation and sustainable development projects.',
        contact_person: 'Priya Sharma',
        phone: '9876543211',
        address: '456 Andheri West, Mumbai, Maharashtra',
        website: 'https://greenearthinitiative.org'
      },
      {
        email: 'ngo3@test.com',
        password: 'password123',
        ngo_name: 'Care & Share',
        darpan_id: 'DL/2023/0009012',
        npo_type: 'Trust',
        registered_state: 'Delhi',
        registered_district: 'New Delhi',
        description: 'Providing food, shelter, and healthcare to homeless and needy people.',
        contact_person: 'Amit Singh',
        phone: '9876543212',
        address: '789 Connaught Place, New Delhi',
        website: 'https://careandshare.org'
      }
    ];

    const createdNGOs = [];

    for (const ngoData of sampleNGOs) {
      // Check if NGO already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', ngoData.email)
        .single();

      if (existingUser) {
        console.log(`NGO with email ${ngoData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(ngoData.password, 12);

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: ngoData.email,
          password_hash: hashedPassword,
          user_type: 'ngo',
          is_verified: true,
          is_approved: true
        })
        .select()
        .single();

      if (userError) {
        console.error(`Failed to create user for ${ngoData.email}:`, userError);
        continue;
      }

      // Create NGO profile
      const { data: ngoProfile, error: profileError } = await supabase
        .from('ngo_profiles')
        .insert({
          user_id: user.id,
          ngo_name: ngoData.ngo_name,
          darpan_id: ngoData.darpan_id,
          npo_type: ngoData.npo_type,
          registered_state: ngoData.registered_state,
          registered_district: ngoData.registered_district,
          description: ngoData.description,
          contact_person: ngoData.contact_person,
          phone: ngoData.phone,
          address: ngoData.address,
          website: ngoData.website,
          verification_status: 'approved'
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Failed to create profile for ${ngoData.email}:`, profileError);
        // Clean up user
        await supabase.from('users').delete().eq('id', user.id);
        continue;
      }

      createdNGOs.push({
        user_id: user.id,
        profile_id: ngoProfile.id,
        email: ngoData.email,
        ngo_name: ngoData.ngo_name,
        credentials: {
          email: ngoData.email,
          password: ngoData.password
        }
      });
    }

    return NextResponse.json({
      message: 'Sample NGOs created successfully',
      created: createdNGOs.length,
      ngos: createdNGOs,
      note: 'All NGOs are pre-approved and verified. You can use these credentials to login.'
    });

  } catch (error) {
    console.error('Create sample NGOs error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}