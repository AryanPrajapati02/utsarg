import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No valid authorization header',
        received: authHeader
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      return NextResponse.json({
        message: 'Current token analysis',
        tokenInfo: {
          hasUserId: !!decoded.userId,
          hasEmail: !!decoded.email,
          hasUserType: !!decoded.userType,
          hasUserTypeSnake: !!decoded.user_type,
          userType: decoded.userType,
          user_type: decoded.user_type,
          isVerified: decoded.isVerified,
          isApproved: decoded.isApproved,
          exp: decoded.exp,
          iat: decoded.iat,
          isExpired: decoded.exp < Date.now() / 1000
        },
        analysis: {
          canAccessVolunteerDashboard: decoded.userType === 'volunteer',
          issue: decoded.userType !== 'volunteer' ? `User type is '${decoded.userType}', expected 'volunteer'` : null
        }
      });

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid token',
        jwtError: jwtError.message,
        tokenPreview: token.substring(0, 50) + '...'
      }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}