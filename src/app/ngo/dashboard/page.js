'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Target, 
  Heart, 
  Users, 
  TrendingUp, 
  Plus,
  Calendar,
  MapPin,
  IndianRupee,
  Clock,
  FileText
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function NGODashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaised: 0,
    totalDonors: 0,
    totalVolunteers: 0,
    pendingVolunteerApplications: 0
  })
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [pendingVolunteerApplications, setPendingVolunteerApplications] = useState([])

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.user_type !== 'ngo') {
        router.push('/login')
        return
      }
      
      // Check if NGO is approved
      if (!payload.isApproved) {
        setUser(payload)
        setLoading(false)
        return // Don't fetch dashboard data if not approved
      }
      
      setUser(payload)
      fetchDashboardData(payload.userId)
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch NGO profile and stats
      const response = await fetch(`/api/ngo/dashboard?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentCampaigns(data.recentCampaigns)
        setPendingVolunteerApplications(data.pendingVolunteerApplications || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="ngo" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Show pending approval message if NGO is not approved
  if (user && !user.isApproved) {
    return (
      <DashboardLayout userType="ngo" user={user}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">
              Verification Pending
            </h2>
            <p className="text-yellow-700 mb-6">
              Thank you for registering your NGO with Utsarg! Your application is currently under review by our admin team. 
              You'll receive an email notification once your NGO has been verified and approved.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-yellow-700 space-y-1 text-left">
                <li>• Our team will review your NGO details and documentation</li>
                <li>• Verification typically takes 24-48 hours</li>
                <li>• You'll receive an email with the verification result</li>
                <li>• Once approved, you can access all dashboard features</li>
              </ul>
            </div>
            <p className="text-sm text-yellow-600">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="ngo" user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">NGO Dashboard</h1>
            <p className="text-neutral-600">Manage your campaigns and track your impact</p>
          </div>
          <Button onClick={() => router.push('/ngo/campaigns/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Raised</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.totalRaised.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Supporters</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalDonors + stats.totalVolunteers}</p>
              </div>
            </div>
          </Card>

          <Card className={stats.pendingVolunteerApplications > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.pendingVolunteerApplications > 0 ? "bg-orange-100" : "bg-yellow-100"
              }`}>
                <Clock className={`w-6 h-6 ${
                  stats.pendingVolunteerApplications > 0 ? "text-orange-600" : "text-yellow-600"
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Pending Volunteers</p>
                <p className={`text-2xl font-bold ${
                  stats.pendingVolunteerApplications > 0 ? "text-orange-900" : "text-neutral-900"
                }`}>
                  {stats.pendingVolunteerApplications}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Volunteer Applications Alert */}
        {stats.pendingVolunteerApplications > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-orange-900">
                {stats.pendingVolunteerApplications} Volunteer{stats.pendingVolunteerApplications > 1 ? 's' : ''} Waiting for Approval
              </h3>
            </div>
            <p className="text-orange-700 mt-1 mb-3">
              You have volunteer applications that need your review.
            </p>
            <Button 
              onClick={() => router.push('/ngo/volunteers')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Review Applications
            </Button>
          </div>
        )}

        {/* Recent Campaigns and Pending Volunteers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Campaigns</h2>
              <Button variant="ghost" onClick={() => router.push('/ngo/campaigns')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recentCampaigns.length > 0 ? (
                recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{campaign.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(campaign.end_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {campaign.location}
                          </div>
                        </div>
                        {campaign.campaign_type === 'money' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>₹{campaign.raised_amount} / ₹{campaign.target_amount}</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${Math.min((campaign.raised_amount / campaign.target_amount) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : campaign.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No campaigns yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/ngo/campaigns/create')}
                  >
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Pending Volunteer Applications */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Pending Volunteers</h2>
              {pendingVolunteerApplications.length > 0 && (
                <Button variant="ghost" onClick={() => router.push('/ngo/volunteers')}>
                  View All
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {pendingVolunteerApplications.length > 0 ? (
                pendingVolunteerApplications.map((application) => (
                  <div key={application.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">
                          {application.volunteer_profiles?.volunteer_profiles?.full_name || 'Unknown Volunteer'}
                        </h3>
                        <div className="text-sm text-neutral-600 mb-2">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {application.message && (
                          <p className="text-sm text-neutral-700 bg-neutral-50 p-2 rounded">
                            "{application.message}"
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No pending volunteer applications</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/ngo/campaigns/create')}
              >
                <Plus className="w-4 h-4 mr-3" />
                Create New Campaign
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/ngo/donations')}
              >
                <Heart className="w-4 h-4 mr-3" />
                View Donations
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/ngo/volunteers')}
              >
                <Users className="w-4 h-4 mr-3" />
                Manage Volunteers
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/ngo/campaigns/reports')}
              >
                <FileText className="w-4 h-4 mr-3" />
                Campaign Reports
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}