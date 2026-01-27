# Supabase Setup Guide for Faith Tracker

## Prerequisites
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project

## Step 1: Run the Schema SQL

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase/schema.sql`
5. Click **Run** to execute

## Step 2: Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public** key

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Schema Overview

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| name | TEXT | User's display name (unique) |
| email | TEXT | Optional email address |
| is_admin | BOOLEAN | Admin flag (default: false) |
| created_at | TIMESTAMPTZ | Record creation timestamp |

#### `daily_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| user_id | UUID | Foreign key to users |
| entry_date | DATE | Date of the entry |
| rosary_completed | BOOLEAN | Rosary prayer completed |
| holy_mass_attended | BOOLEAN | Attended holy mass |
| prayer_time_minutes | INTEGER | Minutes spent in prayer |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Views

#### `leaderboard_stats`
Aggregated statistics for each user:
- Total days logged
- Rosary completion count
- Mass attendance count  
- Total/average prayer minutes
- Total score calculation
- Last activity date

### Row Level Security (RLS)

| Table | Operation | Policy |
|-------|-----------|--------|
| users | SELECT | Everyone can read |
| users | INSERT | Everyone can create |
| users | UPDATE/DELETE | Admins only |
| daily_entries | SELECT | Everyone can read |
| daily_entries | INSERT/UPDATE | Users can modify their own |
| daily_entries | DELETE | Admins only |

### Helper Functions

1. **`get_or_create_daily_entry(user_id, date)`**
   - Returns existing entry or creates a new one
   
2. **`get_user_streak(user_id)`**
   - Calculates consecutive days of activity

## Testing Your Setup

After running the schema, test with these queries in SQL Editor:

```sql
-- Test creating a user
INSERT INTO users (name, email) 
VALUES ('Test User', 'test@example.com')
RETURNING *;

-- Test creating a daily entry
INSERT INTO daily_entries (user_id, entry_date, rosary_completed, prayer_time_minutes)
VALUES (
    (SELECT id FROM users WHERE name = 'Test User'),
    CURRENT_DATE,
    true,
    30
)
RETURNING *;

-- Test leaderboard view
SELECT * FROM leaderboard_stats;

-- Test streak function
SELECT get_user_streak((SELECT id FROM users WHERE name = 'Test User'));
```

## Troubleshooting

### "Permission denied" errors
- Ensure RLS policies are created correctly
- Check that the anon key has proper permissions

### "Unique constraint violation"
- A user with that name already exists
- An entry for that user/date already exists

### Function not found
- Re-run the schema SQL to ensure functions are created
