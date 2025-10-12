import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== VERIFYING DONOR API ROUTES ===')
    
    const results = {
      timestamp: new Date().toISOString(),
      routes: []
    }
    
    // Test routes that should exist
    const routesToTest = [
      '/api/donor/dashboard',
      '/api/donor/donations',
      '/api/donor/profile'
    ]
    
    for (const route of routesToTest) {
      try {
        // Just check if the route responds (without auth for now)
        const response = await fetch(`http://localhost:3000${route}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
        
        results.routes.push({
          route,
          status: response.status,
          exists: response.status !== 404,
          message: response.status === 404 ? 'Route not found' : 
                   response.status === 401 ? 'Route exists (auth required)' : 
                   'Route accessible'
        })
      } catch (error) {
        results.routes.push({
          route,
          status: 'error',
          exists: false,
          message: error.message
        })
      }
    }
    
    return NextResponse.json({
      message: 'Donor API routes verification completed',
      results,
      summary: {
        totalRoutes: routesToTest.length,
        existingRoutes: results.routes.filter(r => r.exists).length,
        missingRoutes: results.routes.filter(r => !r.exists).length
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 })
  }
}