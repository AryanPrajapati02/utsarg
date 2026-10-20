'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function HealthPage() {
  const [state, setState] = useState({ loading: true, online: false, checkedAt: null })

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await fetch('/api/health', { cache: 'no-store' })
      const data = await response.json()
      setState({
        loading: false,
        online: response.ok && data.status === 'ok',
        checkedAt: new Date().toLocaleTimeString()
      })
    } catch {
      setState({ loading: false, online: false, checkedAt: new Date().toLocaleTimeString() })
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">System Health</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Live status of the API and database connection
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {state.loading && !state.checkedAt ? (
              <RefreshCw className="w-10 h-10 text-neutral-400 animate-spin" />
            ) : state.online ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <div>
                  <p className="text-lg font-semibold text-green-700">All Systems Operational</p>
                  <p className="text-sm text-neutral-600">API is reachable and database is online</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-500" />
                <div>
                  <p className="text-lg font-semibold text-red-700">Service Unavailable</p>
                  <p className="text-sm text-neutral-600">API or database could not be reached</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Offline
                </span>
              </>
            )}

            <p className="text-xs text-neutral-500">
              {state.checkedAt ? `Last checked at ${state.checkedAt} (auto-refreshes every 15s)` : 'Checking...'}
            </p>

            <Button
              onClick={checkHealth}
              loading={state.loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
