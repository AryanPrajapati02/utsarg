import { NextResponse } from 'next/server'
import { processCities } from '@/lib/utils'

export async function POST(request) {
  try {
    const { state } = await request.json()

    if (!state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'India',
        state: state
      })
    })

    const data = await response.json()
    
    if (data.error === false && data.data) {
      // Process cities to normalize names and remove duplicates
      const processedCities = processCities(data.data)
      
      return NextResponse.json({
        districts: processedCities,
        success: true
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch districts', districts: [] },
      { status: 500 }
    )

  } catch (error) {
    console.error('Cities API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', districts: [] },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'India'
      })
    })

    const data = await response.json()
    
    if (data.error === false && data.data && data.data.states) {
      // Process state names to normalize them as well
      const processedStates = processCities(data.data.states.map(state => state.name))
      
      return NextResponse.json({
        states: processedStates,
        success: true
      })
    }
    
    // Fallback states if API fails
    const fallbackStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ]
    
    return NextResponse.json({
      states: fallbackStates,
      success: true
    })

  } catch (error) {
    console.error('States API error:', error)
    
    // Return fallback states
    const fallbackStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ]
    
    return NextResponse.json({
      states: fallbackStates,
      success: true
    })
  }
}