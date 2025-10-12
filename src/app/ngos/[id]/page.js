'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, 
  Phone, 
  Globe, 
  Award,
  Calendar,
  Target,
  ArrowLeft,
  ExternalLink,
  Heart,
  Star,
  MessageSquare,
  X
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import FeedbackForm from '@/components/ui/FeedbackForm'
import FloatingFeedbackButton from '@/components/ui/FloatingFeedbackButton'
import QuickRating from '@/components/ui/QuickRating'

export default function NGODetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ngo, setNgo] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [feedback, setFeedback] = useState([])
  const [ratingSummary, setRatingSummary] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch (error) {
        console.error('Invalid token')
      }
    }
    
    fetchNGOData()
    fetchFeedback()
  }, [params.id])

  const fetchNGOData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ngos/${params.id}`)
      
      if (!response.ok) {
        throw new Error('NGO not found')
      }
      
      const data = await response.json()
      setNgo(data.ngo)
      setCampaigns(data.campaigns)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback/${params.id}?limit=5`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setRatingSummary(data.ratingSummary || null)
      }
    } catch (err) {
      console.error('Error fetching feedback:', err)
    }
  }

  const handleFeedbackSubmit = (newFeedback) => {
    setShowFeedbackForm(false)
    fetchFeedback() // Refresh feedback data
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateProgress = (raised, goal) => {
    return goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !ngo) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">NGO Not Found</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link href="/ngos">
            <Button>Browse NGOs</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NGO Header */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                {ngo.logo_url ? (
                  <img
                    src={ngo.logo_url}
                    alt={`${ngo.ngo_name} logo`}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-2xl">
                      {ngo.ngo_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {ngo.ngo_name}
                  </h1>
                  {ngo.npo_type && (
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      {ngo.npo_type}
                    </span>
                  )}
                </div>
              </div>

              {ngo.description && (
                <p className="text-neutral-700 mb-6 text-lg leading-relaxed">
                  {ngo.description}
                </p>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-neutral-600">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{ngo.registered_district}, {ngo.registered_state}</p>
                    {ngo.address && <p className="text-sm">{ngo.address}</p>}
                  </div>
                </div>

                {ngo.phone && (
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Phone className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p>{ngo.phone}</p>
                    </div>
                  </div>
                )}

                {ngo.website && (
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Globe className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={ngo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {ngo.darpan_id && (
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Award className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Registration</p>
                      <p className="text-sm">DARPAN: {ngo.darpan_id}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Badge */}
              <div className="flex items-center gap-2 text-green-600">
                <Award className="w-5 h-5" />
                <span className="font-medium">Verified NGO</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Campaigns Section */}
        {campaigns.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Active Campaigns</h2>
              <Link href={`/campaigns?ngo=${ngo.id}`}>
                <Button variant="outline">View All Campaigns</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-lg mb-2">
                        {campaign.title}
                      </h3>
                      <p className="text-neutral-600 text-sm line-clamp-3">
                        {campaign.description}
                      </p>
                    </div>

                    {/* Campaign Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Raised</span>
                        <span className="font-medium">
                          {formatCurrency(campaign.raised_amount)} of {formatCurrency(campaign.target_amount)}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(campaign.raised_amount, campaign.target_amount)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>{calculateProgress(campaign.raised_amount, campaign.target_amount).toFixed(1)}% funded</span>
                        {campaign.end_date && (
                          <span>
                            Ends {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Campaign Category */}
                    {campaign.category && (
                      <span className="inline-block bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded-full">
                        {campaign.category}
                      </span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                        <Button className="w-full">View Details</Button>
                      </Link>
                      <Link href={`/donate/${campaign.id}`}>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Donate
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Campaigns Message */}
        {campaigns.length === 0 && (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Active Campaigns
            </h3>
            <p className="text-neutral-600">
              This NGO doesn't have any active campaigns at the moment.
            </p>
          </Card>
        )}

        {/* Feedback & Rating Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Rating */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Rate This NGO
            </h3>
            <p className="text-neutral-600 mb-4">
              Help others by sharing your experience with {ngo.ngo_name}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <QuickRating
                  ngoId={params.id}
                  ngoName={ngo.ngo_name}
                  size="lg"
                  onRatingSubmit={(rating) => {
                    // For now, just open the full feedback form
                    setShowFeedbackForm(true)
                  }}
                />
                <span className="text-sm text-neutral-500">Click to rate</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => setShowFeedbackForm(true)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Write Review
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAllReviews(true)}
                  className="flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  View Reviews
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Reviews Preview */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">
              What People Say
            </h3>
            <div className="space-y-3">
              {ratingSummary ? (
                <div className="flex items-center gap-2 text-sm">
                  <QuickRating 
                    currentRating={ratingSummary.average_rating} 
                    readonly={true}
                    size="sm"
                  />
                  <span className="font-medium">{ratingSummary.average_rating.toFixed(1)}</span>
                  <span className="text-neutral-500">• {ratingSummary.total_ratings} reviews</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <QuickRating currentRating={0} readonly={true} size="sm" />
                  <span className="text-neutral-500">No reviews yet</span>
                </div>
              )}
              
              <div className="space-y-2">
                {feedback.length > 0 ? (
                  feedback.slice(0, 2).map((review) => (
                    <div key={review.id} className="text-sm">
                      <p className="text-neutral-700 line-clamp-2">"{review.feedback_text}"</p>
                      <p className="text-neutral-500">- {review.user_name}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500 text-center py-4">
                    <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllReviews(true)}
                  disabled={feedback.length === 0}
                >
                  View All
                </Button>
                <Button 
                  onClick={() => setShowFeedbackForm(true)}
                >
                  Write Review
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="p-8 text-center bg-primary-50 border-primary-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            Want to support {ngo.ngo_name}?
          </h3>
          <p className="text-neutral-600 mb-6">
            Stay updated with their latest campaigns and make a difference in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/campaigns">
              <Button>Browse All Campaigns</Button>
            </Link>
            <Link href="/register?type=donor">
              <Button variant="outline">Become a Donor</Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
            <FeedbackForm
              ngoId={params.id}
              ngoName={ngo.ngo_name}
              userType={user?.userType || 'general'}
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setShowFeedbackForm(false)}
            />
          </div>
        </div>
      )}

      {/* All Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Reviews for {ngo.ngo_name}
                </h2>
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {ratingSummary && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-5 h-5 ${
                            star <= Math.floor(ratingSummary.average_rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xl font-bold">
                      {ratingSummary.average_rating.toFixed(1)}
                    </span>
                    <span className="text-neutral-500">
                      ({ratingSummary.total_ratings} reviews)
                    </span>
                  </div>
                  <Button onClick={() => {
                    setShowAllReviews(false)
                    setShowFeedbackForm(true)
                  }}>
                    Write Review
                  </Button>
                </div>
              )}
            </div>
            
            <div className="p-6">
              {feedback.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-4">No reviews yet</p>
                  <Button onClick={() => {
                    setShowAllReviews(false)
                    setShowFeedbackForm(true)
                  }}>
                    Be the first to review
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedback.map((review) => (
                    <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="font-medium text-neutral-900">
                              {review.user_name}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {new Date(review.created_at).toLocaleDateString()} • {review.category}
                          </p>
                        </div>
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                          {review.user_type}
                        </span>
                      </div>
                      <p className="text-neutral-700">{review.feedback_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Button */}
      {ngo && (
        <FloatingFeedbackButton
          ngoId={params.id}
          ngoName={ngo.ngo_name}
          onOpenFeedback={() => setShowFeedbackForm(true)}
        />
      )}
    </div>
  )
}