'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building, 
  Target, 
  Heart,
  Shield,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  Clock
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNGOs: 0,
    pendingNGOs: 0,
    totalCampaigns: 0,
    totalDonations: 0,
    platformRevenue: 0,
    activeUsers: 0,
    verifiedNGOs: 0
  })
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.role !== 'super_admin' && userData.role !== 'admin') {
          router.push('/login')
          return
        }
        setUser(userData)
        fetchDashboardData()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setPendingVerifications(data.pendingVerifications)
        setRecentActivity(data.recentActivity)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyNGO = async (ngoId, action) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/verify-ngo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ngoId, action })
      })

      if (response.ok) {
        // Refresh data
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to verify NGO:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType={user?.role || "admin"} user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType={user?.role || "admin"} user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600">Platform overview and management</p>
        </div>

        {/* Alert for pending verifications */}
        {pendingVerifications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingVerifications.length} NGO{pendingVerifications.length > 1 ? 's' : ''} pending verification
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Review and approve NGO registrations to maintain platform quality.
                </p>
              </div>
              <Button 
                size="sm" 
                className="ml-auto"
                onClick={() => router.push('/admin/ngos')}
              >
                Review Now
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Users</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</p>
                <p className="text-xs text-green-600">+{stats.activeUsers} active</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">NGOs</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalNGOs}</p>
                <p className="text-xs text-green-600">{stats.verifiedNGOs} verified</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Campaigns</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Donations</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.totalDonations.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Verifications & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending NGO Verifications */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Pending NGO Verifications</h2>
              <Button variant="ghost" onClick={() => router.push('/admin/ngos')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {pendingVerifications.length > 0 ? (
                pendingVerifications.slice(0, 5).map((ngo) => (
                  <div key={ngo.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{ngo.ngo_name}</h3>
                        <div className="text-sm text-neutral-600 space-y-1">
                          <p><strong>DARPAN ID:</strong> {ngo.darpan_id}</p>
                          <p><strong>Type:</strong> {ngo.npo_type}</p>
                          <p><strong>Location:</strong> {ngo.registered_district}, {ngo.registered_state}</p>
                          <p><strong>Contact:</strong> {ngo.contact_person}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVerifyNGO(ngo.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVerifyNGO(ngo.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No pending verifications</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Platform Activity */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
              <Button variant="ghost" onClick={() => router.push('/admin/activity')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'registration' ? 'bg-blue-100' :
                      activity.type === 'donation' ? 'bg-green-100' :
                      activity.type === 'campaign' ? 'bg-purple-100' :
                      'bg-neutral-100'
                    }`}>
                      {activity.type === 'registration' && <Users className="w-4 h-4 text-blue-600" />}
                      {activity.type === 'donation' && <Heart className="w-4 h-4 text-green-600" />}
                      {activity.type === 'campaign' && <Target className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900">{activity.description}</p>
                      <p className="text-xs text-neutral-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Platform Health Metrics */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Platform Health</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Verification Rate</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalNGOs > 0 ? Math.round((stats.verifiedNGOs / stats.totalNGOs) * 100) : 0}%
              </p>
              <p className="text-sm text-neutral-600">NGOs verified</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">User Engagement</h3>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </p>
              <p className="text-sm text-neutral-600">Active users</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Campaign Success</h3>
              <p className="text-2xl font-bold text-purple-600">78%</p>
              <p className="text-sm text-neutral-600">Campaigns funded</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Avg. Response Time</h3>
              <p className="text-2xl font-bold text-yellow-600">2.4h</p>
              <p className="text-sm text-neutral-600">Verification time</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}