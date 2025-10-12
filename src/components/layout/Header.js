'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, Heart, User, LogOut, Bell } from 'lucide-react'
import Button from '../ui/Button'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Decode token to get user info
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

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Utsarg Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-neutral-900">Utsarg</span>
          </Link>

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
                {/* Notifications */}
                <button className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* User Menu */}
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
  )
}