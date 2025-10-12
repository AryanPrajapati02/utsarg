'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, 
  Users, 
  Heart, 
  Target, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react'
import Button from '@/components/ui/Button'

const NAVIGATION = {
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'NGOs', href: '/admin/ngos', icon: Shield },
    { name: 'Donations', href: '/admin/donations', icon: Heart },
    { name: 'Campaigns', href: '/admin/campaigns', icon: Target },
    { name: 'Volunteers', href: '/admin/volunteers', icon: Users },
    { name: 'Applications', href: '/admin/volunteer-applications', icon: FileText },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ],
  super_admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'NGOs', href: '/admin/ngos', icon: Shield },
    { name: 'Donations', href: '/admin/donations', icon: Heart },
    { name: 'Campaigns', href: '/admin/campaigns', icon: Target },
    { name: 'Volunteers', href: '/admin/volunteers', icon: Users },
    { name: 'Applications', href: '/admin/volunteer-applications', icon: FileText },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  ngo: [
    { name: 'Dashboard', href: '/ngo/dashboard', icon: Home },
    { name: 'Campaigns', href: '/ngo/campaigns', icon: Target },
    { name: 'Donations', href: '/ngo/donations', icon: Heart },
    { name: 'Volunteers', href: '/ngo/volunteers', icon: Users },
    { name: 'Reports', href: '/ngo/reports', icon: BarChart3 },
    { name: 'Profile', href: '/ngo/profile', icon: User },
  ],
  donor: [
    { name: 'Dashboard', href: '/donor/dashboard', icon: Home },
    { name: 'My Donations', href: '/donor/donations', icon: Heart },
    { name: 'Browse Campaigns', href: '/donor/campaigns', icon: Target },
    { name: 'Impact Reports', href: '/donor/reports', icon: FileText },
    { name: 'Profile', href: '/donor/profile', icon: User },
  ],
  volunteer: [
    { name: 'Dashboard', href: '/volunteer/dashboard', icon: Home },
    { name: 'Opportunities', href: '/volunteer/opportunities', icon: Target },
    { name: 'Applications', href: '/volunteer/applications', icon: FileText },
    { name: 'Profile', href: '/volunteer/profile', icon: User },
  ]
}

export default function DashboardLayout({ children, userType = 'admin', user = {}, onLogout }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications] = useState([])

  const navigation = NAVIGATION[userType] || []

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('token')
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      router.push('/')
    }
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Utsarg Logo" 
              width={40} 
              height={40}
              className="rounded-lg shadow-md"
            />
            <div>
              <span className="text-xl font-bold text-neutral-900">Utsarg</span>
              <p className="text-xs text-neutral-500 capitalize">
                {userType === 'super_admin' ? 'Super Admin' : userType?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.email}</p>
              <p className="text-xs text-neutral-500">Welcome back!</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = typeof window !== 'undefined' && window.location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                  isActive ? 'text-blue-600' : 'group-hover:scale-105'
                }`} />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-neutral-200 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg py-3"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6 text-neutral-700" />
              </button>
              
              {/* Page title */}
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {typeof window !== 'undefined' && window.location.pathname.includes('dashboard') ? 'Dashboard' : 'Utsarg'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* User info */}
              <div className="flex items-center space-x-3 pl-3 border-l border-neutral-200">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-neutral-900 truncate max-w-32">{user?.email}</p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {userType === 'super_admin' ? 'Super Admin' : userType?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}