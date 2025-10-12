'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Heart, 
  Users, 
  Target,
  IndianRupee,
  Clock
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

const CAMPAIGN_CATEGORIES = [
  'All',
  'Education',
  'Healthcare', 
  'Environment',
  'Disaster Relief',
  'Poverty Alleviation',
  'Women Empowerment',
  'Child Welfare',
  'Elderly Care',
  'Animal Welfare'
]

const CAMPAIGN_TYPES = [
  'All',
  'Money',
  'Clothes',
  'Food',
  'Blood',
  'Volunteer'
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory
    const matchesType = selectedType === 'All' || campaign.campaign_type === selectedType.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesType
  })

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'money': return IndianRupee
      case 'clothes': return Heart
      case 'food': return Heart
      case 'blood': return Heart
      case 'volunteer': return Users
      default: return Target
    }
  }

  const getCampaignTypeColor = (type) => {
    switch (type) {
      case 'money': return 'text-green-600 bg-green-100'
      case 'clothes': return 'text-blue-600 bg-blue-100'
      case 'food': return 'text-orange-600 bg-orange-100'
      case 'blood': return 'text-red-600 bg-red-100'
      case 'volunteer': return 'text-purple-600 bg-purple-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const isExpiringSoon = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft > 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2 sm:mb-4">
            Active Campaigns
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
            Discover meaningful causes and make a difference in your community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field"
                  >
                    {CAMPAIGN_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="input-field"
                  >
                    {CAMPAIGN_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-neutral-600">
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </p>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const TypeIcon = getCampaignTypeIcon(campaign.campaign_type)
              const daysLeft = Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))
              
              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow duration-200">
                  {/* Campaign Image */}
                  <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center">
                    <TypeIcon className="w-16 h-16 text-primary-600" />
                  </div>

                  {/* Campaign Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-neutral-900 text-lg leading-tight">
                        {campaign.title}
                      </h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCampaignTypeColor(campaign.campaign_type)}`}>
                          {campaign.campaign_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-600 text-sm line-clamp-2">
                      {campaign.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {campaign.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                      </div>
                    </div>

                    {/* Progress for money campaigns */}
                    {campaign.campaign_type === 'money' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">₹{campaign.raised_amount?.toLocaleString() || 0} raised</span>
                          <span className="text-neutral-600">₹{campaign.target_amount?.toLocaleString()} goal</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(((campaign.raised_amount || 0) / (campaign.target_amount || 1)) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          {Math.round(((campaign.raised_amount || 0) / (campaign.target_amount || 1)) * 100)}% funded
                        </p>
                      </div>
                    )}

                    {/* Progress for item campaigns */}
                    {['clothes', 'food'].includes(campaign.campaign_type) && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">{campaign.collected_items || 0} collected</span>
                          <span className="text-neutral-600">{campaign.target_items} needed</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-secondary-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(((campaign.collected_items || 0) / (campaign.target_items || 1)) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Expiring soon warning */}
                    {isExpiringSoon(campaign.end_date) && (
                      <div className="flex items-center text-orange-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Ending soon!
                      </div>
                    )}

                    <div className="pt-4 border-t border-neutral-200">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No campaigns found</h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search criteria or check back later for new campaigns.
            </p>
            <Link href="/register?type=ngo">
              <Button>Create a Campaign</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}