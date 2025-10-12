'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  Target,
  Users,
  Share2,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id
  
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkAuth()
    if (campaignId) {
      fetchCampaign()
    }
  }, [campaignId])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else {
        toast.error('Campaign not found')
        router.push('/campaigns')
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
      toast.error('Failed to load campaign')
      router.push('/campaigns')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Draft
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getProgressPercentage = () => {
    if (!campaign) return 0
    
    if (campaign.campaign_type === 'money') {
      return Math.min((campaign.raised_amount / campaign.target_amount) * 100, 100)
    } else {
      return Math.min((campaign.collected_items / campaign.target_items) * 100, 100)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Campaign link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  const handleDonate = () => {
    if (!user) {
      toast.error('Please login to donate')
      router.push('/login')
      return
    }
    
    // Redirect to donation page
    router.push(`/donate/${campaignId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Campaign not found</h3>
              <p className="text-neutral-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => router.push('/campaigns')}>
                Browse Campaigns
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="self-start"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Campaign Image */}
            {campaign.images && campaign.images.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <img
                  src={campaign.images[0]}
                  alt={campaign.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </Card>
            )}

            {/* Campaign Info */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                    {campaign.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-neutral-600 mb-3">
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {campaign.category}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="break-all">
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </span>
                    {campaign.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="break-all">{campaign.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="self-start">
                  {getStatusBadge(campaign.status)}
                </div>
              </div>

              <p className="text-neutral-700 leading-relaxed">
                {campaign.description}
              </p>
            </Card>

            {/* NGO Info */}
            {campaign.ngo && (
              <Card>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">About the Organization</h3>
                <div className="flex items-start space-x-4">
                  {campaign.ngo.logo_url && (
                    <img
                      src={campaign.ngo.logo_url}
                      alt={campaign.ngo.ngo_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-neutral-900">{campaign.ngo.ngo_name}</h4>
                    <p className="text-sm text-neutral-600 mt-1">{campaign.ngo.description}</p>
                    {campaign.ngo.website && (
                      <a
                        href={campaign.ngo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Card */}
            <Card className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
                  {Math.round(getProgressPercentage())}%
                </div>
                <div className="text-xs sm:text-sm text-neutral-600">of goal reached</div>
              </div>

              <div className="w-full bg-neutral-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {campaign.campaign_type === 'money' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-neutral-600">Raised</span>
                      <span className="text-sm sm:text-base font-medium">₹{campaign.raised_amount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-neutral-600">Goal</span>
                      <span className="text-sm sm:text-base font-medium">₹{campaign.target_amount?.toLocaleString() || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-neutral-600">Collected</span>
                      <span className="text-sm sm:text-base font-medium">{campaign.collected_items || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-neutral-600">Needed</span>
                      <span className="text-sm sm:text-base font-medium">{campaign.target_items || 0} items</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-neutral-600">Donors</span>
                  <span className="text-sm sm:text-base font-medium">{campaign.donor_count || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                {campaign.status === 'active' && (
                  <Button
                    onClick={handleDonate}
                    className="w-full"
                    size="lg"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {campaign.campaign_type === 'money' ? 'Donate Now' : 'Contribute Items'}
                  </Button>
                )}
                
                <Button
                  onClick={() => router.push(`/campaigns/${campaignId}/reports`)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Transparency Reports
                </Button>
              </div>
            </Card>

            {/* Time Remaining */}
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3">Time Remaining</h3>
              <div className="text-center">
                {new Date(campaign.end_date) > new Date() ? (
                  <div>
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-neutral-600">days left</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-medium text-neutral-600">Campaign Ended</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}