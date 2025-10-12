import { useState, useEffect } from 'react'

export default function StateCitySelector({ 
  selectedState, 
  selectedCity, 
  onStateChange, 
  onCityChange,
  stateLabel = "State",
  cityLabel = "City",
  stateError,
  cityError,
  required = false,
  disabled = false
}) {
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)

  // Load states on component mount
  useEffect(() => {
    fetchStates()
  }, [])

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState)
    } else {
      setCities([])
      if (onCityChange) {
        onCityChange('')
      }
    }
  }, [selectedState])

  const fetchStates = async () => {
    try {
      setLoadingStates(true)
      const response = await fetch('/api/locations/states-cities')
      if (response.ok) {
        const data = await response.json()
        setStates(data.states || [])
      } else {
        console.error('Failed to fetch states:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setLoadingStates(false)
    }
  }

  const fetchCities = async (state) => {
    try {
      setLoadingCities(true)
      const response = await fetch(`/api/locations/states-cities?state=${encodeURIComponent(state)}`)
      if (response.ok) {
        const data = await response.json()
        setCities(data.cities || [])
      } else {
        console.error(`Failed to fetch cities for ${state}:`, response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const handleStateChange = (e) => {
    const newState = e.target.value
    if (onStateChange) {
      onStateChange(newState)
    }
    // Clear city selection when state changes
    if (onCityChange) {
      onCityChange('')
    }
  }

  const handleCityChange = (e) => {
    if (onCityChange) {
      onCityChange(e.target.value)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* State Selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {stateLabel} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedState || ''}
          onChange={handleStateChange}
          disabled={disabled || loadingStates}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-neutral-50 disabled:text-neutral-500
            ${stateError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300'}
          `}
          required={required}
        >
          <option value="">
            {loadingStates ? 'Loading states...' : 'Select State'}
          </option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {stateError && (
          <p className="mt-1 text-sm text-red-600">{stateError}</p>
        )}
      </div>

      {/* City Selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {cityLabel} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedCity || ''}
          onChange={handleCityChange}
          disabled={disabled || !selectedState || loadingCities}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-neutral-50 disabled:text-neutral-500
            ${cityError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300'}
          `}
          required={required}
        >
          <option value="">
            {!selectedState 
              ? 'Select state first' 
              : loadingCities 
                ? 'Loading cities...' 
                : 'Select City'
            }
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {cityError && (
          <p className="mt-1 text-sm text-red-600">{cityError}</p>
        )}
      </div>
    </div>
  )
}