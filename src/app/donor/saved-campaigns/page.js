'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bookmark, 
  Heart, 
  MapPin,
  Calendar,
  Target,
  Users,
  IndianRupee,
  Trash2,
  Share2,
  CheckCircle
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

export default function SavedCampaigns() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])

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
        if (userData.role !== 'donor') {
          router.push('/login')
          return
        }
        setUser(userData)
        fetchSavedCampaigns()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  const fetchSavedCampaigns = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/donor/saved-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      } else {
        toast.error('Failed to load saved campaigns')
      }
    } catch (error) {
      console.error('Failed to fetch saved campaigns:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCampaign = async (campaignId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/donor/saved-campaigns', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ campaignId })
      })

      if (response.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId))
        toast.success('Campaign removed from saved')
      } else {
        toast.error('Failed to remove campaign')
      }
    } catch (error) {
      console.error('Failed to remove campaign:', error)
      toast.error('Something went wrong')
    }
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
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
            <button
              onClick={() => handleRemoveCampaign(campaign.id)}
              className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Remove from saved"
            >
              <Trash2 className="w-4 h-4" />
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

            <div className="text-xs text-neutral-500 mb-4">
              <div className="flex items-center">
                <Bookmark className="w-3 h-3 mr-1" />
                Saved on {new Date(campaign.saved_at).toLocaleDateString()}
              </div>
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
            <h1 className="text-2xl font-bold text-neutral-900">Saved Campaigns</h1>
            <p className="text-neutral-600">Campaigns you've bookmarked for later</p>
          </div>
          <Button onClick={() => router.push('/donor/campaigns')}>
            <Target className="w-4 h-4 mr-2" />
            Browse More Campaigns
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Saved Campaigns</p>
                <p className="text-2xl font-bold text-neutral-900">{campaigns.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-600">
                {campaigns.filter(c => c.status === 'active').length} active campaigns
              </p>
              <p className="text-xs text-neutral-500">
                {campaigns.filter(c => new Date(c.end_date) > new Date()).length} still accepting donations
              </p>
            </div>
          </div>
        </Card>

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
              <Bookmark className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No saved campaigns yet
              </h3>
              <p className="text-neutral-600 mb-4">
                Start saving campaigns you're interested in to easily find them later.
              </p>
              <Button onClick={() => router.push('/donor/campaigns')}>
                <Target className="w-4 h-4 mr-2" />
                Browse Campaigns
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}