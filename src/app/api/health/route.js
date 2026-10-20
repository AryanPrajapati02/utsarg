import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      return NextResponse.json(
        { status: 'error', database: 'offline' },
        { status: 503 }
      )
    }

    return NextResponse.json({ status: 'ok', database: 'online' })
  } catch {
    return NextResponse.json(
      { status: 'error', database: 'offline' },
      { status: 503 }
    )
  }
}
