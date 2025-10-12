-- Fix orphaned donor profiles by linking them to authenticated users
-- This script addresses the issue where donations are not showing on donor dashboard

-- First, let's see the current state
SELECT 
    'Current State' as status,
    COUNT(*) as total_profiles,
    COUNT(user_id) as linked_profiles,
    COUNT(*) - COUNT(user_id) as orphaned_profiles
FROM donor_profiles;

-- Show orphaned profiles with their donations
SELECT 
    dp.id as profile_id,
    dp.full_name,
    dp.phone,
    dp.user_id,
    COUNT(d.id) as donation_count,
    COALESCE(SUM(d.amount), 0) as total_donated
FROM donor_profiles dp
LEFT JOIN donations d ON dp.id = d.donor_id
WHERE dp.user_id IS NULL
GROUP BY dp.id, dp.full_name, dp.phone, dp.user_id
HAVING COUNT(d.id) > 0;

-- Get the authenticated donor user (assuming there's only one for now)
-- In production, you'd need to be more specific about which user to link to
WITH authenticated_donor AS (
    SELECT id as user_id 
    FROM users 
    WHERE user_type = 'donor' 
    LIMIT 1
),
orphaned_with_donations AS (
    SELECT DISTINCT dp.id as profile_id
    FROM donor_profiles dp
    INNER JOIN donations d ON dp.id = d.donor_id
    WHERE dp.user_id IS NULL
)
-- Link orphaned profiles that have donations to the authenticated user
UPDATE donor_profiles 
SET user_id = (SELECT user_id FROM authenticated_donor)
WHERE id IN (SELECT profile_id FROM orphaned_with_donations);

-- Verify the fix
SELECT 
    'After Fix' as status,
    COUNT(*) as total_profiles,
    COUNT(user_id) as linked_profiles,
    COUNT(*) - COUNT(user_id) as orphaned_profiles
FROM donor_profiles;

-- Show the donations now linked to the authenticated user
SELECT 
    u.email,
    dp.full_name,
    COUNT(d.id) as donation_count,
    COALESCE(SUM(d.amount), 0) as total_donated
FROM users u
INNER JOIN donor_profiles dp ON u.id = dp.user_id
LEFT JOIN donations d ON dp.id = d.donor_id
WHERE u.user_type = 'donor'
GROUP BY u.id, u.email, dp.full_name;