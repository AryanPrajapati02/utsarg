'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  IndianRupee,
  Package,
  Droplets,
  Shirt,
  UtensilsCrossed,
  Upload,
  Save,
  Eye
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StateCitySelector from '@/components/ui/StateCitySelector'
import { toast } from 'react-hot-toast'

const CAMPAIGN_TYPES = [
  { id: 'money', label: 'Money Donation', icon: IndianRupee, description: 'Raise funds for your cause' },
  { id: 'clothes', label: 'Clothes Donation', icon: Shirt, description: 'Collect clothing items' },
  { id: 'food', label: 'Food Donation', icon: UtensilsCrossed, description: 'Collect food items' },
  { id: 'blood', label: 'Blood Donation', icon: Droplets, description: 'Organize blood donation drives' },
  { id: 'other', label: 'Other Items', icon: Package, description: 'Collect other essential items' }
]

const CATEGORIES = [
  'Education', 'Healthcare', 'Environment', 'Animal Welfare',
  'Disaster Relief', 'Poverty Alleviation', 'Women Empowerment',
  'Child Welfare', 'Elderly Care', 'Community Development'
]

export default function CreateCampaignPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    campaign_type: 'money',
    goal_amount: '',
    target_quantity: '',
    unit: '',
    location: '',
    state: '',
    city: '',
    start_date: '',
    end_date: '',
    image_url: '',
    requirements: '',
    terms_conditions: ''
  })
  const [errors, setErrors] = useState({})

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
        if (userData.role !== 'ngo') {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.campaign_type) newErrors.campaign_type = 'Campaign type is required'
    if (!formData.state) newErrors.state = 'State is required'
    if (!formData.city) newErrors.city = 'City is required'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'

    // Validate dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (startDate < today) {
        newErrors.start_date = 'Start date cannot be in the past'
      }
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    // Validate campaign type specific fields
    if (formData.campaign_type === 'money') {
      if (!formData.goal_amount || parseFloat(formData.goal_amount) <= 0) {
        newErrors.goal_amount = 'Goal amount must be greater than 0'
      }
    } else {
      if (!formData.target_quantity || parseInt(formData.target_quantity) <= 0) {
        newErrors.target_quantity = 'Target quantity must be greater than 0'
      }
      if (!formData.unit.trim()) {
        newErrors.unit = 'Unit is required for non-money campaigns'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ngo/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          location: `${formData.city}, ${formData.state}`,
          goal_amount: formData.campaign_type === 'money' ? parseFloat(formData.goal_amount) : null,
          target_quantity: formData.campaign_type !== 'money' ? parseInt(formData.target_quantity) : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Campaign created successfully!')
        router.push('/ngo/campaigns')
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ngo/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          location: `${formData.city}, ${formData.state}`,
          goal_amount: formData.campaign_type === 'money' ? parseFloat(formData.goal_amount) || 0 : null,
          target_quantity: formData.campaign_type !== 'money' ? parseInt(formData.target_quantity) || 0 : null,
          status: 'draft'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Campaign saved as draft!')
        router.push('/ngo/campaigns')
      } else {
        toast.error(data.error || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userType="ngo" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/ngo/campaigns')}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Create New Campaign</h1>
            <p className="text-sm sm:text-base text-neutral-600">Set up your fundraising campaign</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Campaign Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                placeholder="Enter a compelling title for your campaign"
                required
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  rows={4}
                  placeholder="Describe your campaign, its goals, and how donations will be used..."
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.category ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <Input
                  label="Image URL (Optional)"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  icon={<Upload className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>

          {/* Campaign Type */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Campaign Type</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {CAMPAIGN_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div
                    key={type.id}
                    className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                      formData.campaign_type === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => handleInputChange('campaign_type', type.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        formData.campaign_type === type.id ? 'text-primary-600' : 'text-neutral-400'
                      }`} />
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-medium text-neutral-900">{type.label}</h3>
                        <p className="text-xs sm:text-sm text-neutral-600">{type.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Campaign Type Specific Fields */}
            {formData.campaign_type === 'money' ? (
              <Input
                label="Goal Amount (₹)"
                type="number"
                value={formData.goal_amount}
                onChange={(e) => handleInputChange('goal_amount', e.target.value)}
                error={errors.goal_amount}
                placeholder="Enter target amount to raise"
                icon={<IndianRupee className="w-4 h-4" />}
                required
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Quantity"
                  type="number"
                  value={formData.target_quantity}
                  onChange={(e) => handleInputChange('target_quantity', e.target.value)}
                  error={errors.target_quantity}
                  placeholder="Enter target quantity"
                  required
                />
                <Input
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  error={errors.unit}
                  placeholder="e.g., pieces, kg, liters"
                  required
                />
              </div>
            )}
          </Card>

          {/* Location & Duration */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Location & Duration</h2>
            
            <div className="space-y-4">
              <StateCitySelector
                selectedState={formData.state}
                selectedCity={formData.city}
                onStateChange={(state) => handleInputChange('state', state)}
                onCityChange={(city) => handleInputChange('city', city)}
                stateLabel="State"
                cityLabel="City"
                stateError={errors.state}
                cityError={errors.city}
                required={true}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  error={errors.start_date}
                  icon={<Calendar className="w-4 h-4" />}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  error={errors.end_date}
                  icon={<Calendar className="w-4 h-4" />}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Additional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Requirements (Optional)
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Specify any requirements for donations (e.g., clothing sizes, food types, etc.)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Terms & Conditions (Optional)
                </label>
                <textarea
                  value={formData.terms_conditions}
                  onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Add any terms and conditions for this campaign"
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              loading={loading}
              className="flex-1 text-sm sm:text-base"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 text-sm sm:text-base"
            >
              <Eye className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}