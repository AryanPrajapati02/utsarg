'use client'

import { useState } from 'react'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [adminCreated, setAdminCreated] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [customCredentials, setCustomCredentials] = useState({
    email: 'admin@utsarg.com',
    password: 'admin123'
  })

  const createTestAdmin = async (useCustom = false) => {
    setLoading(true)
    try {
      const body = useCustom ? customCredentials : {}
      
      const response = await fetch('/api/admin/create-test-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        setCredentials(data.credentials)
        setAdminCreated(true)
        toast.success('Test admin created successfully!')
      } else {
        toast.error(data.error || 'Failed to create admin')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (adminCreated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Admin Created Successfully!
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Login Credentials:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Email:</strong> {credentials.email}</p>
                <p><strong>Password:</strong> {credentials.password}</p>
              </div>
            </div>
            <div className="space-y-3">
              <a 
                href="/login" 
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Go to Login
              </a>
              <p className="text-xs text-neutral-500">
                Save these credentials in a secure location
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Setup Test Admin
          </h1>
          <p className="text-neutral-600">
            Create a test admin user to access the admin dashboard
          </p>
        </div>

        <div className="space-y-6">
          {/* Quick Setup */}
          <div>
            <h3 className="font-semibold text-neutral-900 mb-3">Quick Setup</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Email:</strong> admin@utsarg.com</p>
                <p><strong>Password:</strong> admin123</p>
              </div>
            </div>
            <Button 
              onClick={() => createTestAdmin(false)}
              loading={loading}
              className="w-full"
            >
              Create Default Admin
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-50 text-neutral-500">or</span>
            </div>
          </div>

          {/* Custom Setup */}
          <div>
            <h3 className="font-semibold text-neutral-900 mb-3">Custom Credentials</h3>
            <div className="space-y-4">
              <Input
                label="Admin Email"
                type="email"
                value={customCredentials.email}
                onChange={(e) => setCustomCredentials(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                label="Admin Password"
                type="password"
                value={customCredentials.password}
                onChange={(e) => setCustomCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button 
                onClick={() => createTestAdmin(true)}
                loading={loading}
                variant="outline"
                className="w-full"
              >
                Create Custom Admin
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• This creates a super admin with full platform access</li>
                  <li>• Use strong passwords in production environments</li>
                  <li>• This endpoint should be disabled in production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}