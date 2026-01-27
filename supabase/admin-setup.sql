-- =============================================
-- ADMIN USER SETUP
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Create a new admin user
INSERT INTO public.users (name, email, is_admin)
VALUES ('Dario', 'dario@eesho', true)
ON CONFLICT (name) DO UPDATE SET is_admin = true;

-- Option 2: Make an existing user an admin (replace 'John Doe' with actual name)
-- UPDATE public.users SET is_admin = true WHERE name = 'John Doe';

-- Option 3: Make a user admin by their ID
-- UPDATE public.users SET is_admin = true WHERE id = 'your-user-uuid-here';

-- View all admin users
SELECT id, name, email, is_admin, created_at 
FROM public.users 
WHERE is_admin = true;

-- View all users with their admin status
SELECT id, name, email, is_admin, created_at 
FROM public.users 
ORDER BY is_admin DESC, name;
