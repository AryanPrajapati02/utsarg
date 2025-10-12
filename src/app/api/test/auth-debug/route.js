import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'No authorization header',
        headers: Object.fromEntries(request.headers.entries())
      }, { status: 401 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Invalid authorization header format',
        authHeader: authHeader
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        authHeader: authHeader
      }, { status: 401 });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ 
        error: 'JWT_SECRET not configured'
      }, { status: 500 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      return NextResponse.json({
        message: 'Token verification successful',
        token: {
          length: token.length,
          preview: token.substring(0, 20) + '...'
        },
        decoded: {
          userId: decoded.userId,
          email: decoded.email,
          user_type: decoded.user_type,
          userType: decoded.userType,
          isVerified: decoded.isVerified,
          isApproved: decoded.isApproved,
          exp: decoded.exp,
          iat: decoded.iat
        },
        checks: {
          hasUserId: !!decoded.userId,
          hasUserType: !!decoded.userType,
          hasUserTypeSnake: !!decoded.user_type,
          userTypeMatch: decoded.user_type === decoded.userType,
          isVolunteer: decoded.userType === 'volunteer',
          isVerified: decoded.isVerified,
          isApproved: decoded.isApproved,
          tokenExpired: decoded.exp < Date.now() / 1000
        }
      });

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'JWT verification failed',
        jwtError: jwtError.message,
        token: {
          length: token.length,
          preview: token.substring(0, 20) + '...'
        }
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}