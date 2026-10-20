'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Heart, Eye, EyeOff, Wand2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@utsarg.com', password: 'admin123' },
  { label: 'NGO', email: 'ngo@utsarg.com', password: 'ngo123' },
  { label: 'Donor', email: 'donor@utsarg.com', password: 'donor123' },
  { label: 'Volunteer', email: 'volunteer@utsarg.com', password: 'volunteer123' }
]

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const fillCredentials = (account) => {
    setFormData({ email: account.email, password: account.password })
    toast.success(`Filled ${account.label} credentials`)
  }

  const seedDemoAccounts = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/test/seed-demo', { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Demo accounts ready. Click "Use" to fill credentials.')
      } else {
        toast.error(data.error || 'Failed to create demo accounts')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSeeding(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage and cookies
        localStorage.setItem('token', data.token)
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
        
        toast.success('Login successful!')
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect')
        
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Redirect based on user type
          const { userType } = data.user
          switch (userType) {
            case 'super_admin':
              router.push('/admin/dashboard')
              break
            case 'admin':
              router.push('/admin/dashboard')
              break
            case 'ngo':
              router.push('/ngo/dashboard')
              break
            case 'donor':
              router.push('/donor/dashboard')
              break
            case 'volunteer':
              router.push('/volunteer/dashboard')
              break
            default:
              router.push('/dashboard')
          }
        }
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600">
            Sign in to your account to continue making a difference
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="Enter your email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Demo Accounts */}
        <Card className="bg-blue-50 border-blue-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">Demo Accounts</h3>
            <button
              type="button"
              onClick={seedDemoAccounts}
              disabled={seeding}
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {seeding ? 'Setting up...' : 'Setup accounts'}
            </button>
          </div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-900">{account.label}</p>
                  <p className="text-xs text-blue-700 break-all">
                    {account.email} / {account.password}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fillCredentials(account)}
                  className="shrink-0 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}