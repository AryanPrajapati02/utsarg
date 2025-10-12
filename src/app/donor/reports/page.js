'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  Heart, 
  Target, 
  Award,
  Calendar,
  Download,
  IndianRupee,
  Users,
  MapPin,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

export default function DonorReports() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('12') // months
  const [reports, setReports] = useState({
    summary: {
      totalDonated: 0,
      campaignsSupported: 0,
      impactScore: 0,
      livesImpacted: 0
    },
    monthlyTrends: [],
    categoryBreakdown: [],
    impactStories: [],
    topCampaigns: [],
    geographicImpact: []
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user, dateRange])

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
        if (userData.role !== 'donor') {
          router.push('/login')
          return
        }
        setUser(userData)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/donor/reports?months=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data)
      } else {
        toast.error('Failed to load reports')
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (type) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/donor/export?type=${type}&months=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `donor_${type}_report_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Report downloaded successfully')
      } else {
        toast.error('Failed to download report')
      }
    } catch (error) {
      console.error('Failed to download report:', error)
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="donor" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="donor" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Impact Reports</h1>
            <p className="text-neutral-600">Track your donation impact and see the difference you're making</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 2 years</option>
              <option value="all">All time</option>
            </select>
            <Button onClick={() => downloadReport('complete')}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Donated</p>
                <p className="text-2xl font-bold text-neutral-900">₹{reports.summary.totalDonated.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Campaigns Supported</p>
                <p className="text-2xl font-bold text-neutral-900">{reports.summary.campaignsSupported}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Lives Impacted</p>
                <p className="text-2xl font-bold text-neutral-900">{reports.summary.livesImpacted}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Impact Score</p>
                <p className="text-2xl font-bold text-neutral-900">{reports.summary.impactScore}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Donation Trends */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Donation Trends</h2>
              <BarChart3 className="w-5 h-5 text-neutral-400" />
            </div>
            
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">Monthly donation chart would go here</p>
                <div className="mt-4 space-y-2">
                  {reports.monthlyTrends.slice(0, 3).map((trend, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{trend.month}:</span>
                      <span className="font-semibold">₹{trend.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Donation by Category</h2>
              <PieChart className="w-5 h-5 text-neutral-400" />
            </div>
            
            <div className="space-y-3">
              {reports.categoryBreakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                    ></div>
                    <span className="text-sm text-neutral-700">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">₹{category.amount.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500">{category.percentage}%</p>
                  </div>
                </div>
              ))}
              {reports.categoryBreakdown.length === 0 && (
                <div className="text-center py-8">
                  <PieChart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No category data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Impact Stories & Top Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Impact Stories */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Impact Stories</h2>
              <Activity className="w-5 h-5 text-neutral-400" />
            </div>
            
            <div className="space-y-4">
              {reports.impactStories.length > 0 ? (
                reports.impactStories.map((story, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{story.title}</h3>
                        <p className="text-sm text-neutral-600 mb-2">{story.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-neutral-500">
                          <span>{story.campaign}</span>
                          <span>{story.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No impact stories yet</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Impact stories will appear as campaigns you support achieve their goals
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Top Campaigns */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Top Supported Campaigns</h2>
              <Target className="w-5 h-5 text-neutral-400" />
            </div>
            
            <div className="space-y-4">
              {reports.topCampaigns.length > 0 ? (
                reports.topCampaigns.map((campaign, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{campaign.title}</h3>
                        <p className="text-sm text-neutral-600 mb-2">by {campaign.ngo_name}</p>
                        <div className="flex items-center space-x-4 text-xs text-neutral-500">
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                            {campaign.category}
                          </span>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {campaign.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          ₹{campaign.your_donation.toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">Your contribution</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No campaigns supported yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/campaigns')}
                  >
                    Browse Campaigns
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Geographic Impact */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Geographic Impact</h2>
            <MapPin className="w-5 h-5 text-neutral-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.geographicImpact.length > 0 ? (
              reports.geographicImpact.map((location, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-neutral-900">{location.state}</h3>
                    <span className="text-sm text-neutral-500">{location.campaigns} campaigns</span>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">₹{location.amount.toLocaleString()}</p>
                  <p className="text-sm text-neutral-600">{location.beneficiaries} people impacted</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No geographic data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Download Options */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Download Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => downloadReport('summary')}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Summary Report
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadReport('detailed')}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Detailed Report
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadReport('tax')}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Tax Certificate
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadReport('impact')}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Impact Report
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}