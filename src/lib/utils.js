// Utility functions for data processing

/**
 * Normalize city/district names by removing diacritical marks and special characters
 * @param {string} name - The city/district name to normalize
 * @returns {string} - Normalized name
 */
export const normalizeCityName = (name) => {
  if (!name || typeof name !== 'string') return name

  return name
    // Remove diacritical marks (ā, ī, ū, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove special characters except spaces, hyphens, and apostrophes
    .replace(/[^\w\s\-']/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
}

/**
 * Normalize an array of city names
 * @param {string[]} cities - Array of city names
 * @returns {string[]} - Array of normalized city names
 */
export const normalizeCityNames = (cities) => {
  if (!Array.isArray(cities)) return []
  
  return cities
    .map(city => normalizeCityName(city))
    .filter(city => city && city.length > 0) // Remove empty strings
    .sort() // Sort alphabetically
}

/**
 * Remove duplicate cities (case-insensitive)
 * @param {string[]} cities - Array of city names
 * @returns {string[]} - Array with duplicates removed
 */
export const removeDuplicateCities = (cities) => {
  if (!Array.isArray(cities)) return []
  
  const seen = new Set()
  return cities.filter(city => {
    const lowerCity = city.toLowerCase()
    if (seen.has(lowerCity)) {
      return false
    }
    seen.add(lowerCity)
    return true
  })
}

/**
 * Process cities array - normalize, remove duplicates, and sort
 * @param {string[]} cities - Raw cities array from API
 * @returns {string[]} - Processed cities array
 */
export const processCities = (cities) => {
  const normalized = normalizeCityNames(cities)
  const unique = removeDuplicateCities(normalized)
  return unique.sort()
}