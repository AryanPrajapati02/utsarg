# Quick Fix for Donor Dashboard 404 Issue

## Problem
- GET /api/donor/dashboard returns 404
- Donations not showing on donor dashboard due to orphaned profiles

## Immediate Solutions

### Option 1: Use the Fixed Dashboard Route
Instead of `/api/donor/dashboard`, use:
```
GET /api/donor/dashboard-fixed
```

This route will:
- Automatically fix orphaned profiles
- Link donations to the authenticated user
- Return dashboard data with donations

### Option 2: Restart Development Server
1. Stop the current server (Ctrl+C)
2. Run: `npm run dev`
3. Try `/api/donor/dashboard` again

### Option 3: Manual Profile Fix
Run this API first to fix orphaned profiles:
```
POST /api/test/manual-profile-fix
```

Then try the dashboard again.

## Testing the Fix

1. **Test the fixed route**:
   ```
   GET /api/donor/dashboard-fixed
   ```

2. **Check if donations appear**:
   The response should include:
   - `stats.totalDonated` > 0
   - `recentDonations` array with donation data
   - `debug.profilesFixed` showing how many profiles were linked

3. **Verify in frontend**:
   Update your frontend to use `/api/donor/dashboard-fixed` temporarily

## Root Cause
The issue was caused by:
1. Donor profiles being created with `user_id: null` (orphaned)
2. Donations linked to orphaned profiles instead of authenticated users
3. Dashboard API looking for donations linked to authenticated user's profile

## Permanent Fix
The `/api/donor/dashboard-fixed` route includes automatic orphaned profile detection and linking, so it should work immediately and fix the data for future requests.

## Next Steps
1. Try the fixed dashboard route
2. If it works, update your frontend to use it
3. Monitor the `debug` section in the response to see how many profiles were fixed
4. Once confirmed working, you can rename the route back to the original path