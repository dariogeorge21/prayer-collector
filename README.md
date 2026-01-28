# 🙏 Prayer Collector (Faith Tracker)

A modern, full-featured web application for tracking daily prayer activities, rosary completion, and holy mass attendance. Built with Next.js 15, React 19, TypeScript, and Supabase.

## ✨ Features

### 📊 Daily Prayer Tracking
- **Rosary Completion**: Track daily rosary prayers with visual checkboxes
- **Holy Mass Attendance**: Mark attendance at holy mass
- **Prayer Timer**: Built-in timer to track prayer time (up to 24 hours/day)
- **Date Validation**: Prevents future date entries and handles timezone correctly
- **Auto-save**: Automatic validation and data persistence

### 👥 User Management
- **Multi-user Support**: Create and manage multiple users
- **User Search**: Quick search functionality to find users
- **User Cards**: Visual user selection interface
- **Profile Management**: Track individual user statistics

### 📈 Leaderboard & Statistics
- **Global Leaderboard**: Ranking system based on prayer activities
- **Weekly Scores**: Track performance over 7-day periods
- **Top Performers**: Highlight top scorers
- **Historical Data**: View past entries and trends
- **Personal History**: Individual user prayer history

### 🔐 Admin Dashboard
- **Protected Admin Area**: Secure admin authentication
- **User Statistics**: Comprehensive analytics for all users
- **User Detail View**: Deep dive into individual user metrics
- **Top Scorers Section**: Monitor most active users
- **User Management**: Oversee all registered users

### 🎨 UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Support**: Theme switching capability
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Smooth loading indicators
- **Offline Detection**: Network status monitoring
- **Confirmation Dialogs**: Prevent accidental data loss
- **Beautiful Animations**: Smooth transitions and micro-interactions

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.5** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Shadcn/ui** - Component library
- **date-fns** - Date manipulation
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - RESTful API

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prayer-collector
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

Follow the detailed instructions in [supabase/SETUP.md](supabase/SETUP.md):

1. Create a Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Copy your project credentials

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
prayer-collector/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Home/User selection page
│   ├── tracker/             # Daily tracker pages
│   ├── leaderboard/         # Leaderboard pages
│   ├── history/             # User history pages
│   └── admin/               # Admin dashboard
├── components/
│   ├── tracker/             # Prayer tracking components
│   ├── leaderboard/         # Leaderboard components
│   ├── history/             # History view components
│   ├── admin/               # Admin dashboard components
│   ├── user-selection/      # User selection/creation
│   ├── layout/              # Layout components
│   └── ui/                  # Reusable UI components (Shadcn)
├── contexts/                # React contexts
│   └── AdminContext.tsx     # Admin authentication context
├── hooks/                   # Custom React hooks
│   ├── use-admin-stats.ts   # Admin statistics
│   ├── use-history.ts       # User history data
│   ├── use-leaderboard.ts   # Leaderboard data
│   ├── use-online-status.ts # Network status
│   ├── use-date-change.ts   # Date change detection
│   └── use-debounce.ts      # Debounce utility
├── lib/                     # Utilities and configurations
│   ├── supabase.ts          # Supabase client
│   ├── database.types.ts    # TypeScript database types
│   ├── validations.ts       # Zod validation schemas
│   ├── stats-utils.ts       # Statistics calculations
│   └── admin-auth.ts        # Admin authentication
├── supabase/                # Database setup files
│   ├── schema.sql           # Database schema
│   ├── leaderboard-function.sql
│   ├── admin-setup.sql
│   └── SETUP.md             # Setup instructions
└── public/                  # Static assets
```

## 📖 Usage Guide

### For Users

1. **Select or Create User**: On the home page, search for your name or create a new user
2. **Daily Tracker**: 
   - Check off completed rosary
   - Mark holy mass attendance
   - Use the timer to track prayer time
   - Save your entry
3. **View Leaderboard**: Check your ranking against other users
4. **Review History**: View your past prayer entries

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin`
2. **Login**: Use admin credentials
3. **View Dashboard**: 
   - See all user statistics
   - Monitor top performers
   - Access detailed user information
4. **User Management**: Click on users to view detailed stats

## ✅ Data Validation

The application includes comprehensive data validation:

- **Prayer Time**: 0-1440 minutes (24 hours max)
- **Entry Requirements**: At least one activity must be completed
- **Date Validation**: No future dates allowed
- **Duplicate Prevention**: One entry per user per day
- **Offline Detection**: Warns when internet connection is lost

See [VALIDATION.md](VALIDATION.md) for detailed validation rules.

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (Text, Unique)
- `email` (Text, Optional)
- `is_admin` (Boolean)
- `created_at` (Timestamp)

### Daily Entries Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `entry_date` (Date)
- `rosary_completed` (Boolean)
- `holy_mass_attended` (Boolean)
- `prayer_time_minutes` (Integer)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Constraints**: Unique combination of `user_id` and `entry_date`

## 🎨 Customization

### Styling
- Modify `app/globals.css` for global styles
- Update `tailwind.config.js` for theme customization
- Components use Tailwind utility classes

### Scoring Logic
- Edit `lib/stats-utils.ts` to adjust scoring calculations
- Modify `supabase/leaderboard-function.sql` for database-level scoring

### Validation Rules
- Update `lib/validations.ts` to change validation schemas

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Render
- Self-hosted with Docker

## 🧪 Testing

```bash
npm run lint
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Ensure `.env.local` exists with correct credentials
- Restart the development server after adding variables

**"User not found"**
- Check that the user exists in the Supabase database
- Verify the user ID in the URL is correct

**"Failed to save entry"**
- Check internet connection
- Verify Supabase project is active
- Check browser console for detailed errors

**Date/Timezone Issues**
- Application uses ISO date format (YYYY-MM-DD)
- Entries are based on local date at time of creation

## 📞 Support

For issues or questions:
1. Check [VALIDATION.md](VALIDATION.md) for validation-related questions
2. Review [supabase/SETUP.md](supabase/SETUP.md) for setup issues
3. Check the browser console for error messages

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend powered by [Supabase](https://supabase.com/)

---

**Made with ❤️ for the faithful community**
