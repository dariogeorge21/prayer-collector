-- =============================================
-- FAITH TRACKER DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- =============================================
-- 2. DAILY_ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    rosary_completed BOOLEAN DEFAULT FALSE,
    holy_mass_attended BOOLEAN DEFAULT FALSE,
    prayer_time_minutes INTEGER DEFAULT 0 CHECK (prayer_time_minutes >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one entry per user per day
    UNIQUE(user_id, entry_date)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON public.daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_entry_date ON public.daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON public.daily_entries(user_id, entry_date);

-- =============================================
-- 3. AUTO-UPDATE TRIGGER FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_entries_updated_at
    BEFORE UPDATE ON public.daily_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. LEADERBOARD VIEW (for aggregated stats)
-- =============================================
CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT 
    u.id AS user_id,
    u.name,
    COUNT(DISTINCT de.entry_date) AS total_days_logged,
    COUNT(DISTINCT CASE WHEN de.rosary_completed THEN de.entry_date END) AS rosary_days,
    COUNT(DISTINCT CASE WHEN de.holy_mass_attended THEN de.entry_date END) AS mass_days,
    COALESCE(SUM(de.prayer_time_minutes), 0) AS total_prayer_minutes,
    COALESCE(AVG(de.prayer_time_minutes), 0)::INTEGER AS avg_prayer_minutes,
    -- Calculate a score: rosary (10pts) + mass (15pts) + prayer minutes
    (COUNT(DISTINCT CASE WHEN de.rosary_completed THEN de.entry_date END) * 10 +
     COUNT(DISTINCT CASE WHEN de.holy_mass_attended THEN de.entry_date END) * 15 +
     COALESCE(SUM(de.prayer_time_minutes), 0)) AS total_score,
    -- Current streak calculation (consecutive days with any activity)
    MAX(de.entry_date) AS last_activity_date
FROM public.users u
LEFT JOIN public.daily_entries de ON u.id = de.user_id
GROUP BY u.id, u.name
ORDER BY total_score DESC;

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- USERS TABLE POLICIES
-- ---------------------------------------------

-- Policy: Anyone can read all users (for user selection page)
CREATE POLICY "Users are viewable by everyone"
    ON public.users
    FOR SELECT
    USING (true);

-- Policy: Anyone can insert new users (for registration)
CREATE POLICY "Anyone can create a user"
    ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can update users
CREATE POLICY "Admins can update users"
    ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Policy: Only admins can delete users
CREATE POLICY "Admins can delete users"
    ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ---------------------------------------------
-- DAILY_ENTRIES TABLE POLICIES
-- ---------------------------------------------

-- Policy: Anyone can read all daily entries (for leaderboard)
CREATE POLICY "Daily entries are viewable by everyone"
    ON public.daily_entries
    FOR SELECT
    USING (true);

-- Policy: Users can insert their own daily entries
-- Note: Since we're using a simple user selection (no auth), 
-- we allow inserts with a check that user_id exists
CREATE POLICY "Users can insert their own entries"
    ON public.daily_entries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = user_id
        )
    );

-- Policy: Users can update their own daily entries
CREATE POLICY "Users can update their own entries"
    ON public.daily_entries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = user_id
        )
    );

-- Policy: Only admins can delete entries
CREATE POLICY "Admins can delete entries"
    ON public.daily_entries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to get or create today's entry for a user
CREATE OR REPLACE FUNCTION get_or_create_daily_entry(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS public.daily_entries AS $$
DECLARE
    v_entry public.daily_entries;
BEGIN
    -- Try to get existing entry
    SELECT * INTO v_entry
    FROM public.daily_entries
    WHERE user_id = p_user_id AND entry_date = p_date;
    
    -- If not found, create one
    IF NOT FOUND THEN
        INSERT INTO public.daily_entries (user_id, entry_date)
        VALUES (p_user_id, p_date)
        RETURNING * INTO v_entry;
    END IF;
    
    RETURN v_entry;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate current streak for a user
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_entry_exists BOOLEAN;
BEGIN
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM public.daily_entries
            WHERE user_id = p_user_id 
            AND entry_date = v_current_date
            AND (rosary_completed OR holy_mass_attended OR prayer_time_minutes > 0)
        ) INTO v_entry_exists;
        
        IF v_entry_exists THEN
            v_streak := v_streak + 1;
            v_current_date := v_current_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment to insert sample data

/*
-- Insert sample users
INSERT INTO public.users (name, email, is_admin) VALUES
    ('John Smith', 'john@example.com', false),
    ('Mary Johnson', 'mary@example.com', false),
    ('Admin User', 'admin@example.com', true),
    ('Peter Williams', null, false),
    ('Sarah Davis', 'sarah@example.com', false);

-- Insert sample entries for the past week
INSERT INTO public.daily_entries (user_id, entry_date, rosary_completed, holy_mass_attended, prayer_time_minutes)
SELECT 
    u.id,
    CURRENT_DATE - (random() * 7)::integer,
    random() > 0.3,
    random() > 0.7,
    (random() * 60)::integer
FROM public.users u
CROSS JOIN generate_series(1, 5);
*/
