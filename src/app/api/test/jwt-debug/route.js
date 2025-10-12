import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      message: 'JWT Debug Info',
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
      hasUserType: !!decoded.user_type,
      hasUserTypeCamel: !!decoded.userType,
      bothMatch: decoded.user_type === decoded.userType
    });

  } catch (error) {
    console.error('JWT Debug error:', error);
    return NextResponse.json({ 
      error: 'Invalid token',
      details: error.message 
    }, { status: 401 });
  }
}