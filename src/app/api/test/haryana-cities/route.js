import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the city.json file
    const filePath = path.join(process.cwd(), 'city.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const cityData = JSON.parse(fileContents)

    // Get Haryana cities specifically
    const haryanaCities = cityData['Haryana'] || []
    
    console.log('Haryana cities from API:', haryanaCities)
    
    return NextResponse.json({
      state: 'Haryana',
      cities: haryanaCities,
      count: haryanaCities.length,
      allStates: Object.keys(cityData),
      debug: {
        fileExists: fs.existsSync(filePath),
        filePath: filePath,
        totalStates: Object.keys(cityData).length
      }
    })

  } catch (error) {
    console.error('Error testing Haryana cities:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load Haryana cities',
        details: error.message 
      },
      { status: 500 }
    )
  }
}