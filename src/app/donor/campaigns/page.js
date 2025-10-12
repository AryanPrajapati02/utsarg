'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Heart, 
  MapPin,
  Calendar,
  Target,
  Users,
  IndianRupee,
  Clock,
  CheckCircle,
  Star,
  Share2,
  Bookmark
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function DonorCampaigns() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    type: '',
    status: 'active',
    sortBy: 'created_at'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [categories] = useState([
    'Education', 'Healthcare', 'Environment', 'Animal Welfare',
    'Disaster Relief', 'Poverty Alleviation', 'Women Empowerment',
    'Child Welfare', 'Elderly Care', 'Community Development'
  ])
  const [savedCampaigns, setSavedCampaigns] = useState(new Set())

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user, filters, pagination.page])

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

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/donor/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
        setSavedCampaigns(new Set(data.savedCampaigns || []))
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        toast.error('Failed to load campaigns')
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSaveCampaign = async (campaignId) => {
    try {
      const token = localStorage.getItem('token')
      const method = savedCampaigns.has(campaignId) ? 'DELETE' : 'POST'
      
      const response = await fetch('/api/donor/saved-campaigns', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ campaignId })
      })

      if (response.ok) {
        setSavedCampaigns(prev => {
          const newSet = new Set(prev)
          if (newSet.has(campaignId)) {
            newSet.delete(campaignId)
            toast.success('Campaign removed from saved')
          } else {
            newSet.add(campaignId)
            toast.success('Campaign saved')
          }
          return newSet
        })
      } else {
        toast.error('Failed to save campaign')
      }
    } catch (error) {
      console.error('Failed to save campaign:', error)
      toast.error('Something went wrong')
    }
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getUrgencyBadge = (daysLeft) => {
    if (daysLeft <= 7) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Urgent</span>
    } else if (daysLeft <= 30) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Soon</span>
    }
    return null
  }

  const CampaignCard = ({ campaign }) => {
    const progress = campaign.campaign_type === 'money' 
      ? getProgressPercentage(campaign.current_amount || 0, campaign.goal_amount)
      : getProgressPercentage(campaign.current_quantity || 0, campaign.target_quantity)
    
    const daysLeft = Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    
    return (
      <Card className="h-full flex flex-col">
        <div className="relative">
          {campaign.image_url && (
            <img 
              src={campaign.image_url} 
              alt={campaign.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          <div className="absolute top-3 right-3 flex space-x-2">
            {getUrgencyBadge(daysLeft)}
            <button
              onClick={() => handleSaveCampaign(campaign.id)}
              className={`p-2 rounded-full ${
                savedCampaigns.has(campaign.id) 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-white text-gray-600'
              } hover:bg-opacity-80 transition-colors`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
              {campaign.category}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
              {campaign.title}
            </h3>
            
            <p className="text-sm text-neutral-600 mb-3 line-clamp-3">
              {campaign.description}
            </p>

            <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {campaign.ngo_name}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {campaign.location}
              </div>
            </div>

            {campaign.campaign_type === 'money' ? (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Raised</span>
                  <span className="font-medium">
                    ₹{(campaign.current_amount || 0).toLocaleString()} of ₹{campaign.goal_amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>{progress.toFixed(1)}% funded</span>
                  <span>{campaign.donors_count || 0} donors</span>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Collected</span>
                  <span className="font-medium">
                    {campaign.current_quantity || 0} of {campaign.target_quantity} {campaign.unit}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>{progress.toFixed(1)}% collected</span>
                  <span>{campaign.donors_count || 0} contributors</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
              </div>
              {campaign.verification_status === 'verified' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              className="flex-1"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate Now
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.share({
                  title: campaign.title,
                  text: campaign.description,
                  url: `${window.location.origin}/campaigns/${campaign.id}`
                }).catch(() => {
                  navigator.clipboard.writeText(`${window.location.origin}/campaigns/${campaign.id}`)
                  toast.success('Link copied to clipboard')
                })
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
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
            <h1 className="text-2xl font-bold text-neutral-900">Browse Campaigns</h1>
            <p className="text-neutral-600">Discover causes you care about and make a difference</p>
          </div>
          <Button onClick={() => router.push('/donor/saved-campaigns')}>
            <Bookmark className="w-4 h-4 mr-2" />
            Saved Campaigns
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="money">Money</option>
              <option value="clothes">Clothes</option>
              <option value="food">Food</option>
              <option value="blood">Blood</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="all">All Status</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input-field"
            >
              <option value="created_at">Newest</option>
              <option value="end_date">Ending Soon</option>
              <option value="goal_amount">Highest Goal</option>
              <option value="current_amount">Most Funded</option>
              <option value="donors_count">Most Popular</option>
            </select>
          </div>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {campaigns.length} of {pagination.total} campaigns
          </p>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">
              {Object.values(filters).filter(f => f && f !== 'active' && f !== 'created_at').length} filters applied
            </span>
          </div>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {Object.values(filters).some(f => f && f !== 'active' && f !== 'created_at') 
                  ? 'No campaigns found' 
                  : 'No campaigns available'
                }
              </h3>
              <p className="text-neutral-600 mb-4">
                {Object.values(filters).some(f => f && f !== 'active' && f !== 'created_at')
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Check back later for new campaigns to support.'
                }
              </p>
              {Object.values(filters).some(f => f && f !== 'active' && f !== 'created_at') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      search: '',
                      category: '',
                      location: '',
                      type: '',
                      status: 'active',
                      sortBy: 'created_at'
                    })
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}