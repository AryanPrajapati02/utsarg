-- Create Test Admin User for Utsarg Platform
-- Run this SQL script in your Supabase SQL editor or database client

-- First, check if admin already exists
DO $$
DECLARE
    admin_exists BOOLEAN;
    hashed_password TEXT;
    admin_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE email = 'admin@utsarg.com'
    ) INTO admin_exists;
    
    IF admin_exists THEN
        RAISE NOTICE 'Admin user already exists with email: admin@utsarg.com';
    ELSE
        -- Generate a hashed password for 'admin123'
        -- Note: In production, use a stronger password and proper hashing
        -- This is a bcrypt hash for 'admin123' with salt rounds 12
        hashed_password := '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/pPRt7Aq';
        
        -- Insert admin user
        INSERT INTO users (
            email,
            password_hash,
            user_type,
            is_verified,
            is_approved,
            otp,
            otp_expires_at,
            created_at,
            updated_at
        ) VALUES (
            'admin@utsarg.com',
            hashed_password,
            'super_admin',
            true,
            true,
            null,
            null,
            NOW(),
            NOW()
        ) RETURNING id INTO admin_id;
        
        RAISE NOTICE 'Test admin created successfully!';
        RAISE NOTICE 'Admin ID: %', admin_id;
        RAISE NOTICE 'Email: admin@utsarg.com';
        RAISE NOTICE 'Password: admin123';
        RAISE NOTICE 'Login URL: %/login', 'http://localhost:3002';
    END IF;
END $$;

-- Verify the admin was created
SELECT 
    id,
    email,
    user_type,
    is_verified,
    is_approved,
    created_at
FROM users 
WHERE email = 'admin@utsarg.com';