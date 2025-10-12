import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Debug info
    const debugInfo = {
      hasAuthHeader: !!authHeader,
      authHeaderFormat: authHeader ? authHeader.substring(0, 20) + '...' : null,
      jwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No token provided',
        debug: debugInfo
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Get user data from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, user_type, is_verified, is_approved')
        .eq('id', decoded.userId)
        .single()

      if (error) {
        return NextResponse.json({ 
          error: 'Database error', 
          details: error.message,
          debug: debugInfo
        }, { status: 500 })
      }

      if (!user) {
        return NextResponse.json({ 
          error: 'User not found',
          debug: debugInfo
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          user_type: user.user_type,
          is_verified: user.is_verified,
          is_approved: user.is_approved
        },
        decoded: {
          userId: decoded.userId,
          userType: decoded.userType,
          exp: decoded.exp
        },
        debug: debugInfo
      })

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid token', 
        details: jwtError.message,
        debug: debugInfo
      }, { status: 401 })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Authentication failed',
      details: error.message,
      debug: {
        hasAuthHeader: !!request.headers.get('authorization'),
        jwtSecret: !!process.env.JWT_SECRET
      }
    }, { status: 500 })
  }
}

// Test endpoint without auth
export async function POST() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return NextResponse.json({
      message: 'Debug endpoint working',
      database: error ? 'Error: ' + error.message : 'Connected',
      env: {
        jwtSecret: !!process.env.JWT_SECRET,
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error.message
    }, { status: 500 })
  }
}