'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth(requiredUserType = null) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          setLoading(false)
          setIsAuthenticated(false)
          return
        }

        // Decode JWT token
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        // Check if token is expired
        const currentTime = Date.now() / 1000
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('token')
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
          setLoading(false)
          setIsAuthenticated(false)
          return
        }

        // Check user type if required
        if (requiredUserType && payload.user_type !== requiredUserType) {
          // Redirect to appropriate dashboard
          const dashboardUrl = getDashboardUrl(payload.user_type)
          router.push(dashboardUrl)
          return
        }

        setUser(payload)
        setIsAuthenticated(true)
        setLoading(false)

      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('token')
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        setLoading(false)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [requiredUserType, router])

  const logout = () => {
    localStorage.removeItem('token')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    setUser(null)
    setIsAuthenticated(false)
    router.push('/login')
  }

  return {
    user,
    loading,
    isAuthenticated,
    logout
  }
}

function getDashboardUrl(userType) {
  switch (userType) {
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard'
    case 'ngo':
      return '/ngo/dashboard'
    case 'donor':
      return '/donor/dashboard'
    case 'volunteer':
      return '/volunteer/dashboard'
    default:
      return '/login'
  }
}