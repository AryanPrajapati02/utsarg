import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const state = searchParams.get('state') || ''
    const category = searchParams.get('category') || ''

    const offset = (page - 1) * limit

    // Build query for verified NGOs only (include pending for development)
    let query = supabaseAdmin
      .from('ngo_profiles')
      .select(`
        id,
        ngo_name,
        description,
        website,
        phone,
        address,
        registered_district,
        registered_state,
        darpan_id,
        npo_type,
        logo_url,
        created_at,
        verification_status
      `)
      .in('verification_status', ['approved', 'verified', 'pending'])

    // Apply filters
    if (search) {
      query = query.or(`ngo_name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (city) {
      query = query.eq('registered_district', city)
    }
    
    if (state) {
      query = query.eq('registered_state', state)
    }
    
    if (category) {
      query = query.eq('npo_type', category)
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('ngo_profiles')
      .select('*', { count: 'exact', head: true })
      .in('verification_status', ['approved', 'verified', 'pending'])

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: ngos, error } = await query

    if (error) {
      console.error('Error fetching NGOs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch NGOs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ngos: ngos || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('NGOs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}