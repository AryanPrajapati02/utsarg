'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DonationSuccessPage({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [donation, setDonation] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDonationDetails = async () => {
      try {
        const donationId = searchParams.get('donation_id')
        const campaignId = await params.id

        if (!donationId) {
          setError('Donation ID not found')
          return
        }

        // Fetch donation details
        const donationResponse = await fetch(`/api/donations/${donationId}`)
        if (!donationResponse.ok) {
          throw new Error('Donation not found')
        }
        const donationData = await donationResponse.json()
        setDonation(donationData.donation)

        // Fetch campaign details
        const campaignResponse = await fetch(`/api/campaigns/${campaignId}`)
        if (!campaignResponse.ok) {
          throw new Error('Campaign not found')
        }
        const campaignData = await campaignResponse.json()
        setCampaign(campaignData.campaign)

      } catch (error) {
        console.error('Error fetching details:', error)
        setError('Failed to load donation details')
      } finally {
        setLoading(false)
      }
    }

    fetchDonationDetails()
  }, [params.id, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/campaigns')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Campaigns
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Your Donation!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Your generous contribution will make a real difference.
            </p>

            {/* Donation Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Donation Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">{donation?.transaction_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-green-600">₹{donation?.amount?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign:</span>
                  <span className="font-medium">{campaign?.title}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">NGO:</span>
                  <span className="font-medium">{campaign?.ngo?.ngo_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {donation?.donation_date ? new Date(donation.donation_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">
                    {donation?.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-left mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• You will receive a confirmation email with your donation receipt</li>
                <li>• The NGO will be notified of your contribution</li>
                <li>• You can track the campaign's progress and impact</li>
                <li>• Tax-deductible receipt will be sent within 24 hours</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/campaigns/${params.id}`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                View Campaign
              </button>
              
              <button
                onClick={() => router.push('/campaigns')}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
              >
                Browse More Campaigns
              </button>
            </div>

            {/* Social Sharing */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Help spread the word about this cause:</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    const text = `I just donated to "${campaign?.title}" on NGO Platform. Join me in making a difference!`
                    const url = `${window.location.origin}/campaigns/${params.id}`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Share on Twitter
                </button>
                
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/campaigns/${params.id}`
                    navigator.clipboard.writeText(url)
                    alert('Campaign link copied to clipboard!')
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}