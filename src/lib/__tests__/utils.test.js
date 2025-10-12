// Test file to demonstrate city name normalization
// This is for documentation purposes - you can run these tests to verify the functionality

import { normalizeCityName, processCities } from '../utils'

// Example test cases showing how city names are normalized
const testCases = [
  // Input -> Expected Output
  { input: 'Bhānder', expected: 'Bhander' },
  { input: 'Āgra', expected: 'Agra' },
  { input: 'Jālandhar', expected: 'Jalandhar' },
  { input: 'Nāgpur', expected: 'Nagpur' },
  { input: 'Kānpur', expected: 'Kanpur' },
  { input: 'Lucknow', expected: 'Lucknow' }, // No change needed
  { input: 'New Delhi', expected: 'New Delhi' }, // Spaces preserved
  { input: "St. Mary's", expected: "St Marys" }, // Special chars removed
  { input: 'Coimbatore', expected: 'Coimbatore' }, // No change needed
]

// Test the normalization function
console.log('City Name Normalization Tests:')
console.log('================================')

testCases.forEach(({ input, expected }) => {
  const result = normalizeCityName(input)
  const passed = result === expected
  console.log(`${input} -> ${result} ${passed ? '✓' : '✗ (expected: ' + expected + ')'}`)
})

// Test with array processing
const sampleCities = [
  'Bhānder',
  'Āgra', 
  'Agra', // Duplicate after normalization
  'Jālandhar',
  'Mumbai',
  'Nāgpur',
  'Nagpur', // Duplicate after normalization
  'Pune'
]

console.log('\nArray Processing Test:')
console.log('=====================')
console.log('Input:', sampleCities)
console.log('Output:', processCities(sampleCities))

export { testCases }