# Donor Dashboard Fix Guide

## Issue
- Donations not showing on donor dashboard
- GET /api/donor/dashboard returns 404

## Root Cause
1. **Orphaned Donor Profiles**: Some donor profiles have `user_id: null`, meaning they're not linked to authenticated users
2. **Route Not Found**: The dashboard API route is returning 404

## Solutions

### 1. Fix Orphaned Profiles
Run the manual profile fix API:
```
POST /api/test/manual-profile-fix
```

This will:
- Link orphaned profiles with donations to the authenticated user
- Clean up empty orphaned profiles
- Ensure donations are visible on the dashboard

### 2. Fix Route Issues
If the dashboard route returns 404:

1. **Restart the Next.js server**:
   ```bash
   npm run dev
   ```

2. **Use the alternative dashboard route**:
   ```
   GET /api/donor/dashboard-new
   ```

3. **Check server logs** for any import or syntax errors

### 3. Test the Fix
After running the profile fix:

1. Test the new dashboard route:
   ```
   GET /api/donor/dashboard-new
   ```

2. Check if donations are now visible:
   ```
   GET /api/test/check-donor-dashboard-issue
   ```

### 4. Database Direct Fix (if needed)
If APIs are not working, run this SQL directly:

```sql
-- Link orphaned profiles with donations to the authenticated user
UPDATE donor_profiles 
SET user_id = (
    SELECT id FROM users WHERE user_type = 'donor' LIMIT 1
)
WHERE user_id IS NULL 
AND id IN (
    SELECT DISTINCT donor_id FROM donations WHERE donor_id IS NOT NULL
);
```

## Files Modified
- `src/app/api/donor/dashboard/route.js` - Added debugging
- `src/app/api/donor/dashboard-new/route.js` - Alternative route
- `src/app/api/test/manual-profile-fix/route.js` - Fix orphaned profiles
- `src/app/api/donations/create/route.js` - Prevent future orphaned profiles

## Next Steps
1. Run the manual profile fix
2. Test the dashboard
3. If working, update the frontend to use the correct route
4. Monitor for future orphaned profile creation