import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    // Find user with this reset token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiryDate = new Date(user.reset_token_expires_at)

    if (now > expiryDate) {
      // Clean up expired token
      await supabase
        .from('users')
        .update({
          reset_token: null,
          reset_token_expires_at: null
        })
        .eq('id', user.id)

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Reset token is valid' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}