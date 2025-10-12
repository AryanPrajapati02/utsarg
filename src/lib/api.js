// API utility functions for location services
import { processCities } from './utils'

export const fetchDistrictsByState = async (state) => {
  try {
    // Try external API first
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
      // Process cities to remove diacritical marks and normalize
      return processCities(data.data)
    }
    
    // Fallback to internal API
    const fallbackResponse = await fetch('/api/locations/cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state })
    })
    
    const fallbackData = await fallbackResponse.json()
    return processCities(fallbackData.districts || [])
    
  } catch (error) {
    console.error('Error fetching cities:', error)
    return []
  }
}

export const fetchStates = async () => {
  try {
    // Try external API first
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
      return data.data.states.map(state => state.name).sort()
    }
    
    // Fallback to internal API
    const fallbackResponse = await fetch('/api/locations/cities')
    const fallbackData = await fallbackResponse.json()
    return fallbackData.states || []
    
  } catch (error) {
    console.error('Error fetching states:', error)
    // Final fallback to hardcoded states
    return [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ]
  }
}