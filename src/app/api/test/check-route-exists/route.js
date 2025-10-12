import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if we can access the donor dashboard route
    const response = await fetch('http://localhost:3000/api/donor/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
    
    return NextResponse.json({
      message: 'Route check completed',
      dashboardRouteStatus: response.status,
      dashboardRouteExists: response.status !== 404
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Route check failed',
      error: error.message
    })
  }
}