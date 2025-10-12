import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || (payload.user_type !== 'super_admin' && payload.user_type !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all NGOs with user information
    const { data: ngos, error } = await supabaseAdmin
      .from('ngo_profiles')
      .select(`
        *,
        users!inner(email, id, created_at)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching NGOs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch NGOs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ngos: ngos || []
    })

  } catch (error) {
    console.error('Admin NGOs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}