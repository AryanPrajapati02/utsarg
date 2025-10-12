import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // Read the city.json file
    const filePath = path.join(process.cwd(), 'city.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const cityData = JSON.parse(fileContents)

    // If state is provided, return cities for that state
    if (state) {
      const cities = cityData[state] || []
      return NextResponse.json({
        state,
        cities: cities.sort()
      })
    }

    // If no state provided, return all states
    const states = Object.keys(cityData).sort()
    return NextResponse.json({
      states
    })

  } catch (error) {
    console.error('Error reading city data:', error)
    return NextResponse.json(
      { error: 'Failed to load location data' },
      { status: 500 }
    )
  }
}

// Also support POST for bulk requests
export async function POST(request) {
  try {
    const { states } = await request.json()

    // Read the city.json file
    const filePath = path.join(process.cwd(), 'city.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const cityData = JSON.parse(fileContents)

    const result = {}
    
    if (states && Array.isArray(states)) {
      // Return cities for multiple states
      states.forEach(state => {
        if (cityData[state]) {
          result[state] = cityData[state].sort()
        }
      })
    } else {
      // Return all data
      Object.keys(cityData).forEach(state => {
        result[state] = cityData[state].sort()
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error reading city data:', error)
    return NextResponse.json(
      { error: 'Failed to load location data' },
      { status: 500 }
    )
  }
}