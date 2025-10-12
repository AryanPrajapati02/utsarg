'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'

export default function DonatePage({ params }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState('')
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    fetchCampaign()
    if (isAuthenticated && user) {
      fetchDonorProfile()
    }
  }, [isAuthenticated, user])

  const fetchCampaign = async () => {
    try {
      const campaignId = await params.id
      const response = await fetch(`/api/campaigns/${campaignId}`)
      
      if (!response.ok) {
        throw new Error('Campaign not found')
      }
      
      const data = await response.json()
      setCampaign(data.campaign)
    } catch (error) {
      console.error('Error fetching campaign:', error)
      setError('Campaign not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchDonorProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/donor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Pre-fill donor info if profile exists
        if (data.profile) {
          setDonorInfo({
            name: data.profile.full_name || '',
            email: user.email || '',
            phone: data.profile.phone || '',
            address: data.profile.address || ''
          })
        } else {
          // Just set email from user data
          setDonorInfo(prev => ({
            ...prev,
            email: user.email || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching donor profile:', error)
      // Just set email from user data if profile fetch fails
      setDonorInfo(prev => ({
        ...prev,
        email: user.email || ''
      }))
    }
  }

  const handleDonorInfoChange = (field, value) => {
    setDonorInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setError(`Please enter a valid ${campaign.campaign_type === 'money' ? 'donation amount' : 'estimated value'}`)
      return
    }

    if (!donorInfo.name || !donorInfo.email || !donorInfo.phone) {
      setError('Please fill in all required fields')
      return
    }

    // Additional validation for different campaign types
    if (campaign.campaign_type !== 'money' && parseFloat(donationAmount) < 10) {
      setError('Minimum estimated value should be ₹10')
      return
    }

    setProcessing(true)
    setError('')

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway')
      }

      // Create donation record
      const donationPayload = {
        campaign_id: campaign.id,
        amount: parseFloat(donationAmount),
        donor_name: donorInfo.name,
        donor_email: donorInfo.email,
        donor_phone: donorInfo.phone,
        donor_address: donorInfo.address,
        donation_type: campaign.campaign_type || 'money'
      }

      // Add donor_id if user is authenticated (this should be the user ID, not donor profile ID)
      if (isAuthenticated && user) {
        donationPayload.donor_id = user.id
      }

      const donationResponse = await fetch('/api/donations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify(donationPayload)
      })

      if (!donationResponse.ok) {
        throw new Error('Failed to create donation')
      }

      const donationData = await donationResponse.json()

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: parseFloat(donationAmount) * 100, // Amount in paise
        currency: 'INR',
        name: campaign.ngo.ngo_name,
        description: `${campaign.campaign_type === 'money' ? 'Donation' : `${campaign.campaign_type} donation`} for ${campaign.title}`,
        order_id: donationData.razorpay_order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`/api/donations/${donationData.donation_id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            if (verifyResponse.ok) {
              alert('Thank you for your donation!')
              router.push(`/campaigns/${campaign.id}`)
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: donorInfo.name,
          email: donorInfo.email,
          contact: donorInfo.phone
        },
        notes: {
          campaign_id: campaign.id,
          donation_type: campaign.campaign_type || 'money'
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
            console.log('Payment modal closed')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        alert(`Payment failed: ${response.error.description}`)
        setProcessing(false)
      })

    } catch (error) {
      console.error('Donation error:', error)
      setError(error.message || 'Failed to process donation')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Info */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">{campaign.title}</h1>
            <div className="mb-4">
              {campaign.images?.[0] ? (
                <img 
                  src={campaign.images[0]} 
                  alt={campaign.title}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center ${campaign.images?.[0] ? 'hidden' : 'flex'}`}
                style={{ display: campaign.images?.[0] ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-600 font-medium">{campaign.title}</p>
                  <p className="text-blue-500 text-sm capitalize">{campaign.campaign_type} Campaign</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{campaign.description}</p>
            
            <div className="space-y-2">
              {campaign.target_amount && (
                <div className="flex justify-between">
                  <span className="font-medium">Goal:</span>
                  <span>₹{campaign.target_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Raised:</span>
                <span>₹{(campaign.raised_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Donors:</span>
                <span>{campaign.donor_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Campaign Type:</span>
                <span className="capitalize">{campaign.campaign_type}</span>
              </div>
              {campaign.target_items && (
                <div className="flex justify-between">
                  <span className="font-medium">Target Items:</span>
                  <span>{campaign.target_items.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Progress Bar for Money Campaigns */}
            {campaign.campaign_type === 'money' && campaign.target_amount && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((campaign.raised_amount / campaign.target_amount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min((campaign.raised_amount / campaign.target_amount) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">About {campaign.ngo.ngo_name}</h3>
              <p className="text-blue-800 text-sm">{campaign.ngo.description}</p>
            </div>
          </Card>

          {/* Donation Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Make a Donation</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Campaign Type Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Campaign Type:</strong> {campaign.campaign_type === 'money' ? 'Monetary Donation' : 
                    campaign.campaign_type === 'blood' ? 'Blood Donation' :
                    campaign.campaign_type === 'food' ? 'Food Donation' :
                    campaign.campaign_type === 'clothes' ? 'Clothing Donation' : 
                    campaign.campaign_type}
                </p>
                {campaign.campaign_type !== 'money' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Note: For non-monetary donations, the amount represents the estimated value of your contribution.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {campaign.campaign_type === 'money' ? 'Donation Amount (₹) *' : 'Estimated Value (₹) *'}
                </label>
                <Input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder={campaign.campaign_type === 'money' ? 'Enter amount' : 'Enter estimated value'}
                  min="1"
                />
                {campaign.campaign_type !== 'money' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please estimate the monetary value of your {campaign.campaign_type} donation
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={donorInfo.name}
                  onChange={(e) => handleDonorInfoChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={donorInfo.email}
                  onChange={(e) => handleDonorInfoChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  value={donorInfo.phone}
                  onChange={(e) => handleDonorInfoChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address (Optional)
                </label>
                <textarea
                  value={donorInfo.address}
                  onChange={(e) => handleDonorInfoChange('address', e.target.value)}
                  placeholder="Enter your address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <button
                onClick={handleDonate}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {processing ? 'Processing...' : `Donate ₹${donationAmount || '0'}`}
              </button>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Secure Payment
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment is processed securely through our trusted payment gateway. All transactions are encrypted and protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}