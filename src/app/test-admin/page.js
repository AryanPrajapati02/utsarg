'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function TestAdminPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAdminUsersAPI = async () => {
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setResult({ error: 'No token found in localStorage' })
        return
      }

      console.log('Testing admin users API with token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/test/admin-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setResult({ status: response.status, data })

    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testRealAdminUsersAPI = async () => {
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setResult({ error: 'No token found in localStorage' })
        return
      }

      console.log('Testing real admin users API with token:', token.substring(0, 20) + '...')

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setResult({ status: response.status, data })

    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Admin API Test</h1>
        
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Test Admin Users API</h2>
            
            <div className="flex space-x-4">
              <Button onClick={testAdminUsersAPI} loading={loading}>
                Test Debug API
              </Button>
              <Button onClick={testRealAdminUsersAPI} loading={loading}>
                Test Real API
              </Button>
            </div>

            {result && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}