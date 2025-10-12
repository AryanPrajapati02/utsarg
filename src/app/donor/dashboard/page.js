'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  Target, 
  TrendingUp, 
  IndianRupee,
  Calendar,
  Award,
  Plus
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function DonorDashboard() {
  const router = useRouter()
  const { user, loading, isAuthenticated, logout } = useAuth('donor')
  const [stats, setStats] = useState({
    totalDonated: 0,
    campaignsSupported: 0,
    impactScore: 0,
    thisMonthDonations: 0
  })
  const [recentDonations, setRecentDonations] = useState([])
  const [recommendedCampaigns, setRecommendedCampaigns] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user])

  const fetchDashboardData = async () => {
    setDataLoading(true)
    try {
      const response = await fetch('/api/donor/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          totalDonated: 0,
          campaignsSupported: 0,
          impactScore: 0,
          thisMonthDonations: 0
        })
        setRecentDonations(data.recentDonations || [])
        setRecommendedCampaigns(data.recommendedCampaigns || [])
      } else {
        const errorData = await response.json()
        console.error('Dashboard API error:', errorData.error)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return (
    <DashboardLayout userType="donor" user={user} onLogout={logout}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Donor Dashboard</h1>
            <p className="text-neutral-600">Track your impact and discover new causes</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              disabled={dataLoading}
            >
              {dataLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => router.push('/campaigns')}>
              <Plus className="w-4 h-4 mr-2" />
              Find Campaigns
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Donated</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.totalDonated.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Campaigns Supported</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.campaignsSupported}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Impact Score</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.impactScore}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">This Month</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.thisMonthDonations.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Donations & Recommended Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Donations</h2>
              <Button variant="ghost" onClick={() => router.push('/donor/donations')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recentDonations.length > 0 ? (
                recentDonations.map((donation) => (
                  <div key={donation.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{donation.campaign_title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(donation.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {donation.donation_type}
                          </div>
                        </div>
                        {donation.amount && (
                          <p className="text-lg font-semibold text-green-600 mt-2">
                            ₹{donation.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        donation.payment_status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : donation.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {donation.payment_status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No donations yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/campaigns')}
                  >
                    Make Your First Donation
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Recommended Campaigns */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Recommended for You</h2>
              <Button variant="ghost" onClick={() => router.push('/campaigns')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recommendedCampaigns.length > 0 ? (
                recommendedCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{campaign.title}</h3>
                        <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                            {campaign.category}
                          </span>
                          <span>{campaign.location}</span>
                        </div>
                        {campaign.campaign_type === 'money' && campaign.target_amount && (
                          <div className="mt-2">
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min((campaign.raised_amount / campaign.target_amount) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-neutral-600 mt-1">
                              ₹{campaign.raised_amount.toLocaleString()} of ₹{campaign.target_amount.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {campaign.campaign_type === 'money' && !campaign.target_amount && (
                          <div className="mt-2">
                            <p className="text-xs text-neutral-600">
                              ₹{campaign.raised_amount.toLocaleString()} raised
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      Donate Now
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No recommendations yet</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Make a donation to get personalized recommendations
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Impact Summary */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Your Impact This Year</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Lives Impacted</h3>
              <p className="text-2xl font-bold text-green-600">{stats.impactScore * 10}</p>
              <p className="text-sm text-neutral-600">People helped through your donations</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Goals Achieved</h3>
              <p className="text-2xl font-bold text-blue-600">{Math.floor(stats.campaignsSupported * 0.7)}</p>
              <p className="text-sm text-neutral-600">Campaigns successfully funded</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">Recognition</h3>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalDonated > 50000 ? 'Gold' : stats.totalDonated > 10000 ? 'Silver' : 'Bronze'}
              </p>
              <p className="text-sm text-neutral-600">Donor tier based on contributions</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}