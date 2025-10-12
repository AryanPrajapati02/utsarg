'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, Heart, User, LogOut, Bell, Home, Target, Users, Info, Phone, FileText, Shield, Cookie } from 'lucide-react'
import Button from '../ui/Button'

export default function PublicLayout({ children, showSidebar = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    
    switch (user.userType) {
      case 'super_admin':
        return '/admin/dashboard'
      case 'ngo':
        return '/ngo/dashboard'
      case 'donor':
        return '/donor/dashboard'
      case 'volunteer':
        return '/volunteer/dashboard'
      default:
        return '/dashboard'
    }
  }

  const sidebarLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Campaigns', href: '/campaigns', icon: Target },
    { name: 'NGOs', href: '/ngos', icon: Users },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Phone },
    { name: 'Terms & Conditions', href: '/terms', icon: FileText },
    { name: 'Privacy Policy', href: '/privacy', icon: Shield },
    { name: 'Cookie Policy', href: '/cookies', icon: Cookie },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center space-x-4">
              {showSidebar && (
                <button
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors lg:hidden"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">Utsarg</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/campaigns" className="text-neutral-600 hover:text-primary-600 transition-colors">
                Campaigns
              </Link>
              <Link href="/ngos" className="text-neutral-600 hover:text-primary-600 transition-colors">
                NGOs
              </Link>
              <Link href="/about" className="text-neutral-600 hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-neutral-600 hover:text-primary-600 transition-colors">
                Contact
              </Link>
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <button className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                      <User className="w-5 h-5 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-700">{user.email}</span>
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link 
                        href={getDashboardLink()}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-t-lg"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      >
                        Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-neutral-200">
              <nav className="flex flex-col space-y-4">
                <Link href="/campaigns" className="text-neutral-600 hover:text-primary-600 transition-colors">
                  Campaigns
                </Link>
                <Link href="/ngos" className="text-neutral-600 hover:text-primary-600 transition-colors">
                  NGOs
                </Link>
                <Link href="/about" className="text-neutral-600 hover:text-primary-600 transition-colors">
                  About
                </Link>
                <Link href="/contact" className="text-neutral-600 hover:text-primary-600 transition-colors">
                  Contact
                </Link>
                
                {user ? (
                  <div className="pt-4 border-t border-neutral-200 space-y-2">
                    <Link href={getDashboardLink()}>
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="w-full text-red-600">
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-neutral-200 space-y-2">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile sidebar backdrop */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } mt-16 lg:mt-0`}>
              <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Navigation
                </h3>
                {sidebarLinks.map((item) => {
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
                      onClick={() => setIsSidebarOpen(false)}
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
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}