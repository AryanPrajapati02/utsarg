import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

const DEMO_ACCOUNTS = [
  {
    email: 'admin@utsarg.com',
    password: 'admin123',
    userType: 'super_admin'
  },
  {
    email: 'ngo@utsarg.com',
    password: 'ngo123',
    userType: 'ngo',
    profileTable: 'ngo_profiles',
    profile: {
      ngo_name: 'Demo NGO',
      darpan_id: 'DEMO-DARPAN-001',
      npo_type: 'Charitable Trust',
      registered_state: 'Delhi',
      registered_district: 'New Delhi',
      description: 'Demo NGO account for testing',
      contact_person: 'Demo Contact',
      phone: '9999999999',
      verification_status: 'approved'
    }
  },
  {
    email: 'donor@utsarg.com',
    password: 'donor123',
    userType: 'donor',
    profileTable: 'donor_profiles',
    profile: {
      full_name: 'Demo Donor',
      phone: '9999999999'
    }
  },
  {
    email: 'volunteer@utsarg.com',
    password: 'volunteer123',
    userType: 'volunteer',
    profileTable: 'volunteer_profiles',
    profile: {
      full_name: 'Demo Volunteer',
      phone: '9999999999'
    }
  }
]

export async function POST() {
  try {
    const results = []

    for (const account of DEMO_ACCOUNTS) {
      const passwordHash = await hashPassword(account.password)

      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', account.email)
        .maybeSingle()

      let userId
      let status

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            password_hash: passwordHash,
            user_type: account.userType,
            is_verified: true,
            is_approved: true
          })
          .eq('id', existing.id)

        if (updateError) {
          results.push({ email: account.email, status: 'failed', error: updateError.message })
          continue
        }

        userId = existing.id
        status = 'updated'
      } else {
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            email: account.email,
            password_hash: passwordHash,
            user_type: account.userType,
            is_verified: true,
            is_approved: true
          })
          .select()
          .single()

        if (insertError) {
          results.push({ email: account.email, status: 'failed', error: insertError.message })
          continue
        }

        userId = newUser.id
        status = 'created'
      }

      if (account.profileTable) {
        const { data: profile } = await supabaseAdmin
          .from(account.profileTable)
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()

        if (!profile) {
          const { error: profileError } = await supabaseAdmin
            .from(account.profileTable)
            .insert({ ...account.profile, user_id: userId })

          if (profileError) {
            results.push({
              email: account.email,
              status,
              profileError: profileError.message
            })
            continue
          }
        }
      }

      results.push({
        email: account.email,
        password: account.password,
        userType: account.userType,
        status
      })
    }

    return NextResponse.json({ success: true, accounts: results })
  } catch (error) {
    console.error('Seed demo accounts error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
