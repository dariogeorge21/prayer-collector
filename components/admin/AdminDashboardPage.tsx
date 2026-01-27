'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { UserStatsTable } from '@/components/admin/UserStatsTable'
import { TopScorersSection } from '@/components/admin/TopScorersSection'
import { useAdmin } from '@/contexts/AdminContext'
import { useAdminStats } from '@/hooks/use-admin-stats'
import { BackgroundLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Trophy,
  Calendar,
  UserPlus,
  Trash2,
  UserCheck,
  Sparkles,
  Church,
  Clock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}

function AdminDashboardContent() {
  const router = useRouter()
  const { session, logout } = useAdmin()
  const { stats, isLoading: statsLoading, isValidating, refresh: refreshStats } = useAdminStats()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Stats cards configuration
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Active Today',
      value: stats.activeUsersToday,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Rosaries This Month',
      value: stats.rosariesThisMonth,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Masses This Month',
      value: stats.massesThisMonth,
      icon: Church,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Prayer Hours',
      value: stats.prayerHoursThisMonth,
      subtitle: `${stats.prayerMinutesThisMonth % 60}m`,
      icon: Clock,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      title: 'Avg. per User',
      value: stats.totalUsers > 0 
        ? Math.round(stats.prayerMinutesThisMonth / stats.totalUsers) 
        : 0,
      subtitle: 'min/month',
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
    },
  ]

  const adminFeatures = [
    {
      title: 'Manage Users',
      description: 'View, edit, and delete user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'View Analytics',
      description: 'See prayer statistics and trends',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Leaderboard',
      description: 'View and manage the leaderboard',
      icon: Trophy,
      href: '/leaderboard/' + session?.userId,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Settings',
      description: 'Configure app settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
    },
  ]

  const quickActions = [
    {
      title: 'Add New User',
      icon: UserPlus,
      action: () => router.push('/'),
    },
    {
      title: 'View Calendar',
      icon: Calendar,
      action: () => router.push('/admin/calendar'),
    },
    {
      title: 'Cleanup Data',
      icon: Trash2,
      action: () => router.push('/admin/cleanup'),
    },
  ]

  return (
    <BackgroundLayout>
      <div className="pb-8 animate-fade-in-up">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="-ml-2 text-gray-600 hover:text-gray-900 btn-bounce"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 btn-bounce"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary animate-pulse-soft" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome back, <span className="font-medium">{session?.name}</span>
            </p>
          </div>
        </header>

        {/* Stats Overview Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Stats Overview
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStats}
              disabled={isValidating}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isValidating && "animate-spin")} />
              {isValidating ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <Card 
                key={stat.title} 
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-md card-interactive animate-fade-in-up",
                  stat.borderColor,
                  "border-l-4"
                )}
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: 'both',
                }}
              >
                <CardContent className="p-4">
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                        <div className="flex items-baseline gap-1">
                          <p className={cn("text-3xl font-bold", stat.color)}>
                            {stat.value.toLocaleString()}
                          </p>
                          {stat.subtitle && (
                            <span className="text-sm text-gray-400">{stat.subtitle}</span>
                          )}
                        </div>
                      </div>
                      <div className={cn("p-3 rounded-full", stat.bgColor)}>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Month indicator */}
          <p className="mt-3 text-xs text-gray-400 text-center">
            Monthly stats for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </section>

        {/* Top Scorers Section */}
        <TopScorersSection />

        {/* User Stats Table */}
        <section className="mb-8">
          <UserStatsTable />
        </section>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {adminFeatures.map((feature, index) => (
            <Card
              key={feature.title}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] card-interactive animate-fade-in-up"
              onClick={() => router.push(feature.href)}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both',
              }}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-lg ${feature.bgColor} transition-transform group-hover:scale-110`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  onClick={action.action}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card className="mt-6 bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Session Info
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">User:</span> {session?.name}</p>
              <p><span className="font-medium">Session expires:</span> {session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackgroundLayout>
  )
}
