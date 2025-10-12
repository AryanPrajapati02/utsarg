'use client'

import { useState, useEffect } from 'react'

export default function TestAuthPage() {
  const [token, setToken] = useState(null)
  const [authResult, setAuthResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    setToken(storedToken)
    
    if (storedToken) {
      testAuth(storedToken)
    }
  }, [])

  const testAuth = async (tokenToTest) => {
    try {
      console.log('Testing auth with token:', tokenToTest?.substring(0, 20) + '...')
      
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToTest}`
        }
      })

      console.log('Auth response status:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('Auth successful:', userData)
        setAuthResult(userData)
        setError(null)
      } else {
        const errorData = await response.text()
        console.log('Auth failed:', errorData)
        setError(`Auth failed with status ${response.status}: ${errorData}`)
        setAuthResult(null)
      }
    } catch (err) {
      console.error('Auth test error:', err)
      setError(`Auth test error: ${err.message}`)
      setAuthResult(null)
    }
  }

  const loginAndTest = async () => {
    try {
      console.log('Logging in...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@utsarg.com',
          password: 'admin123'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Login successful:', data)
        
        localStorage.setItem('token', data.token)
        setToken(data.token)
        
        // Test the new token
        await testAuth(data.token)
      } else {
        const errorData = await response.text()
        console.log('Login failed:', errorData)
        setError(`Login failed: ${errorData}`)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(`Login error: ${err.message}`)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Token Status</h2>
          <p className="text-sm text-gray-600">
            {token ? `Token exists: ${token.substring(0, 50)}...` : 'No token found'}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Authentication Result</h2>
          {authResult ? (
            <div className="bg-green-50 p-4 rounded">
              <p><strong>✅ Auth Successful</strong></p>
              <p>Email: {authResult.email}</p>
              <p>Role: {authResult.role}</p>
              <p>User Type: {authResult.user_type}</p>
              <p>Is Admin: {authResult.role === 'admin' || authResult.role === 'super_admin' ? 'Yes' : 'No'}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded">
              <p><strong>❌ Auth Failed</strong></p>
              <p>{error}</p>
            </div>
          ) : (
            <p className="text-gray-500">No auth test performed yet</p>
          )}
        </div>

        <div className="space-x-4">
          <button
            onClick={loginAndTest}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login & Test Auth
          </button>
          
          {token && (
            <button
              onClick={() => testAuth(token)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Current Token
            </button>
          )}
          
          <button
            onClick={() => {
              localStorage.removeItem('token')
              setToken(null)
              setAuthResult(null)
              setError(null)
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear Token
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Test NGO API</h2>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/ngos', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                console.log('NGO API response:', response.status)
                
                if (response.ok) {
                  const data = await response.json()
                  console.log('NGO API data:', data)
                  alert(`NGO API Success: ${data.ngos?.length || 0} NGOs found`)
                } else {
                  const errorData = await response.text()
                  console.log('NGO API error:', errorData)
                  alert(`NGO API Failed: ${response.status} - ${errorData}`)
                }
              } catch (err) {
                console.error('NGO API error:', err)
                alert(`NGO API Error: ${err.message}`)
              }
            }}
            disabled={!token}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            Test NGO API
          </button>
        </div>
      </div>
    </div>
  )
}