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
      setError('Please enter a valid donation amount')
      return
    }

    if (!donorInfo.name || !donorInfo.email || !donorInfo.phone) {
      setError('Please fill in all required fields')
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
        donation_type: 'money'
      }

      // Add donor_id if user is authenticated
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
        description: `Donation for ${campaign.title}`,
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
          donation_type: 'money'
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
      {/* Test Mode Banner */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Test Mode:</strong> This is a test environment. No real money will be charged. Use test card details for payments.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Info */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">{campaign.title}</h1>
            <div className="mb-4">
              <img 
                src={campaign.image_url || '/placeholder-campaign.jpg'} 
                alt={campaign.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <p className="text-gray-600 mb-4">{campaign.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Goal:</span>
                <span>₹{campaign.goal_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Raised:</span>
                <span>₹{campaign.amount_raised?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Donors:</span>
                <span>{campaign.donor_count || 0}</span>
              </div>
            </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                />
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

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Test Mode Active
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This is Razorpay test mode. Use these test card details:</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <strong>Successful Payment:</strong>
                          <ul className="list-disc list-inside mt-1">
                            <li>Card: 4111 1111 1111 1111</li>
                            <li>CVV: Any 3 digits</li>
                            <li>Expiry: Any future date</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Failed Payment (for testing):</strong>
                          <ul className="list-disc list-inside mt-1">
                            <li>Card: 4000 0000 0000 0002</li>
                            <li>CVV: Any 3 digits</li>
                            <li>Expiry: Any future date</li>
                          </ul>
                        </div>
                      </div>
                    </div>
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