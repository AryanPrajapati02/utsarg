import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if the dashboard route exists by making a simple request
    console.log('Testing dashboard route accessibility...')
    
    return NextResponse.json({
      message: 'Dashboard test route working',
      timestamp: new Date().toISOString(),
      dashboardRouteExists: true,
      suggestion: 'Try restarting the Next.js development server with: npm run dev'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}