# City Name Normalization

This document explains how city names are automatically cleaned and normalized in the NGO Platform.

## Problem

The external API (countriesnow.space) returns city names with diacritical marks and special characters that can cause issues with:
- Database storage
- Search functionality
- User experience
- Data consistency

## Solution

We automatically normalize all city names by:

1. **Removing Diacritical Marks**: Converting characters like ā, ī, ū to a, i, u
2. **Cleaning Special Characters**: Removing unnecessary punctuation
3. **Removing Duplicates**: Eliminating duplicate entries after normalization
4. **Sorting**: Alphabetically ordering for better UX

## Examples

| Original API Response | Normalized Result |
|----------------------|-------------------|
| Bhānder              | Bhander           |
| Āgra                 | Agra              |
| Jālandhar            | Jalandhar         |
| Nāgpur               | Nagpur            |
| Kānpur               | Kanpur            |
| St. Mary's           | St Marys          |
| Coimbatore           | Coimbatore        |

## Implementation

The normalization happens in multiple places:

### 1. Frontend API Calls (`src/lib/api.js`)
```javascript
import { processCities } from './utils'

export const fetchCitiesByState = async (state) => {
  // ... API call
  return processCities(data.data) // Normalize before returning
}
```

### 2. Backend API Routes (`src/app/api/locations/cities/route.js`)
```javascript
import { processCities } from '@/lib/utils'

// Process cities to normalize names and remove duplicates
const processedCities = processCities(data.data)
```

### 3. Utility Functions (`src/lib/utils.js`)
```javascript
export const normalizeCityName = (name) => {
  return name
    .normalize('NFD')                    // Decompose characters
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritical marks
    .replace(/[^\w\s\-']/g, '')         // Remove special chars
    .replace(/\s+/g, ' ')               // Clean spaces
    .trim()                             // Trim whitespace
}
```

## Benefits

1. **Consistent Data**: All city names follow the same format
2. **Better Search**: Users can search without worrying about special characters
3. **Database Efficiency**: Cleaner data storage and indexing
4. **User Experience**: Easier to read and select cities
5. **Duplicate Prevention**: Automatic removal of duplicate entries

## Testing

You can test the normalization by running the test cases in:
```
src/lib/__tests__/utils.test.js
```

## Configuration

The normalization is automatic and requires no configuration. It handles:
- Unicode normalization (NFD)
- Diacritical mark removal
- Special character cleaning
- Duplicate removal
- Alphabetical sorting

## Fallback Handling

If the external API fails:
1. Falls back to internal API route
2. Uses hardcoded state list if needed
3. Always applies normalization to any data source
4. Gracefully handles empty or invalid responses

This ensures consistent city names regardless of the data source.