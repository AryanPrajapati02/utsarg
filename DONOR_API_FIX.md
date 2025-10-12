# Donor API Routes Fix

## Problem
Multiple donor API routes are returning 404 errors:
- `GET /api/donor/dashboard` - 404
- `GET /api/donor/donations` - 404

## Root Cause
1. **Next.js Route Recognition Issue**: The development server isn't recognizing the API routes
2. **Orphaned Donor Profiles**: Donations linked to profiles with `user_id: null`

## Fixed Routes Available

### 1. Dashboard API
**Original**: `GET /api/donor/dashboard`
**Fixed**: `GET /api/donor/dashboard-fixed`

Features:
- Automatically fixes orphaned profiles
- Returns dashboard stats and recent donations
- Includes debug information

### 2. Donations API
**Original**: `GET /api/donor/donations?page=1&limit=10`
**Fixed**: `GET /api/donor/donations-fixed?page=1&limit=10`

Features:
- Automatically fixes orphaned profiles
- Supports pagination, filtering by status and type
- Returns donation history with campaign details
- Includes summary statistics

## Quick Fix Steps

### Step 1: Use Fixed Routes Immediately
Replace in your frontend:
```javascript
// OLD
const dashboardResponse = await fetch('/api/donor/dashboard')
const donationsResponse = await fetch('/api/donor/donations?page=1&limit=10')

// NEW (temporary fix)
const dashboardResponse = await fetch('/api/donor/dashboard-fixed')
const donationsResponse = await fetch('/api/donor/donations-fixed?page=1&limit=10')
```

### Step 2: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test Original Routes
After restart, try the original routes:
- `GET /api/donor/dashboard`
- `GET /api/donor/donations?page=1&limit=10`

## API Response Format

### Dashboard Fixed Response
```json
{
  "stats": {
    "totalDonated": 99899,
    "campaignsSupported": 4,
    "impactScore": 119,
    "thisMonthDonations": 0
  },
  "recentDonations": [
    {
      "id": "donation-id",
      "campaign_title": "Campaign Name",
      "amount": 143,
      "donation_type": "money",
      "payment_status": "completed",
      "created_at": "2025-10-12T03:55:17.94905"
    }
  ],
  "donorProfile": {
    "name": "Donor Name",
    "preferredCauses": []
  },
  "debug": {
    "profilesFixed": 2,
    "totalProfiles": 1,
    "totalDonations": 6
  }
}
```

### Donations Fixed Response
```json
{
  "donations": [
    {
      "id": "donation-id",
      "campaign": {
        "id": "campaign-id",
        "title": "Campaign Title",
        "category": "education",
        "campaign_type": "fundraising",
        "ngo_name": "NGO Name"
      },
      "amount": 143,
      "donation_type": "money",
      "payment_status": "completed",
      "created_at": "2025-10-12T03:55:17.94905"
    }
  ],
  "stats": {
    "totalDonations": 6,
    "completedDonations": 6,
    "pendingDonations": 0,
    "totalAmount": 99899,
    "donationTypes": {
      "money": 2,
      "clothes": 1,
      "food": 1,
      "blood": 2
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 6,
    "totalPages": 1
  },
  "debug": {
    "profilesFixed": 0,
    "totalProfiles": 1,
    "queryParams": {
      "page": 1,
      "limit": 10,
      "status": null,
      "type": null
    }
  }
}
```

## Permanent Solution

Once the fixed routes are working and you've verified the data is correct:

1. **Rename the fixed routes** to replace the original ones
2. **Update your frontend** to use the original route names
3. **Monitor the debug section** to ensure no more orphaned profiles are created

## Testing Commands

Test the fixed routes:
```bash
# Dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/donor/dashboard-fixed

# Donations
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3000/api/donor/donations-fixed?page=1&limit=5"
```

The fixed routes include automatic orphaned profile detection and linking, so they should work immediately and show all your donations.