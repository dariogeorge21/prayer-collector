'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { useAdmin } from '@/contexts/AdminContext'
import { BackgroundLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

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

  const handleLogout = () => {
    logout()
    router.push('/')
  }

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
      <div className="pb-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="-ml-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome back, <span className="font-medium">{session?.name}</span>
            </p>
          </div>
        </header>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {adminFeatures.map((feature) => (
            <Card
              key={feature.title}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
              onClick={() => router.push(feature.href)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={`p-3 rounded-lg ${feature.bgColor}`}>
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
