'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        
        toast.success('Email verified successfully!')
        
        // Redirect based on user type
        const { userType } = data.user
        switch (userType) {
          case 'super_admin':
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
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      toast.error('Email address is required')
      return
    }

    setResendLoading(true)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP sent successfully!')
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-primary-600">
            {email}
          </p>
        </div>

        {/* Verification Form */}
        <Card>
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <Input
              label="Verification Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions</h3>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• Check your email inbox for the verification code</li>
              <li>• The code will expire in 15 minutes</li>
              <li>• Check your spam folder if you don't see the email</li>
              <li>• Contact support if you continue having issues</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}expor
t default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}