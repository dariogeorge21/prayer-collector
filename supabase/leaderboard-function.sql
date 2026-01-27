-- =============================================
-- OPTIMIZED LEADERBOARD FUNCTION
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_leaderboard_with_streaks();

-- Create optimized leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard_with_streaks()
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    total_days_logged BIGINT,
    rosary_days BIGINT,
    mass_days BIGINT,
    total_prayer_minutes BIGINT,
    avg_prayer_minutes INTEGER,
    total_score BIGINT,
    last_activity_date DATE,
    current_streak INTEGER,
    rank INTEGER
) AS $$
DECLARE
    r RECORD;
    streak INTEGER;
    current_rank INTEGER := 0;
BEGIN
    FOR r IN (
        SELECT 
            u.id AS uid,
            u.name AS uname,
            COUNT(DISTINCT de.entry_date) AS days_logged,
            COUNT(DISTINCT CASE WHEN de.rosary_completed THEN de.entry_date END) AS r_days,
            COUNT(DISTINCT CASE WHEN de.holy_mass_attended THEN de.entry_date END) AS m_days,
            COALESCE(SUM(de.prayer_time_minutes), 0) AS prayer_mins,
            COALESCE(AVG(de.prayer_time_minutes), 0)::INTEGER AS avg_mins,
            (COUNT(DISTINCT CASE WHEN de.rosary_completed THEN de.entry_date END) * 10 +
             COUNT(DISTINCT CASE WHEN de.holy_mass_attended THEN de.entry_date END) * 15 +
             COALESCE(SUM(de.prayer_time_minutes), 0)) AS score,
            MAX(de.entry_date) AS last_date
        FROM public.users u
        LEFT JOIN public.daily_entries de ON u.id = de.user_id
        GROUP BY u.id, u.name
        ORDER BY score DESC
    )
    LOOP
        -- Calculate streak for this user
        SELECT calculate_user_streak(r.uid) INTO streak;
        
        current_rank := current_rank + 1;
        
        user_id := r.uid;
        name := r.uname;
        total_days_logged := r.days_logged;
        rosary_days := r.r_days;
        mass_days := r.m_days;
        total_prayer_minutes := r.prayer_mins;
        avg_prayer_minutes := r.avg_mins;
        total_score := r.score;
        last_activity_date := r.last_date;
        current_streak := streak;
        rank := current_rank;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized streak calculation function
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_has_today BOOLEAN;
    v_prev_date DATE := NULL;
    v_entry RECORD;
BEGIN
    -- Check if there's an entry for today
    SELECT EXISTS(
        SELECT 1 FROM public.daily_entries
        WHERE user_id = p_user_id AND entry_date = CURRENT_DATE
    ) INTO v_has_today;
    
    -- If no entry today, start checking from yesterday
    IF NOT v_has_today THEN
        v_current_date := CURRENT_DATE - INTERVAL '1 day';
    END IF;
    
    -- Loop through entries in descending order
    FOR v_entry IN (
        SELECT entry_date
        FROM public.daily_entries
        WHERE user_id = p_user_id
        AND entry_date <= v_current_date
        ORDER BY entry_date DESC
        LIMIT 365  -- Max streak to check
    )
    LOOP
        IF v_prev_date IS NULL THEN
            -- First entry
            IF v_entry.entry_date = v_current_date THEN
                v_streak := 1;
                v_prev_date := v_entry.entry_date;
            ELSE
                EXIT; -- No streak
            END IF;
        ELSE
            -- Check if consecutive
            IF v_entry.entry_date = v_prev_date - INTERVAL '1 day' THEN
                v_streak := v_streak + 1;
                v_prev_date := v_entry.entry_date;
            ELSE
                EXIT; -- Streak broken
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create index for faster streak calculations
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date_desc 
ON public.daily_entries(user_id, entry_date DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_leaderboard_with_streaks() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_streak(UUID) TO anon, authenticated;
