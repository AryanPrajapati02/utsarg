'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Heart, Building, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import StateCitySelector from '@/components/ui/StateCitySelector'

const USER_TYPES = [
  {
    id: 'ngo',
    title: 'NGO',
    description: 'Register your organization to create campaigns and receive donations',
    icon: Building,
    color: 'primary'
  },
  {
    id: 'donor',
    title: 'Donor',
    description: 'Support causes by donating money, goods, or blood',
    icon: Heart,
    color: 'secondary'
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    description: 'Contribute your time and skills to meaningful causes',
    icon: Users,
    color: 'accent'
  }
]

const NPO_TYPES = [
  'Educational', 'Healthcare', 'Environmental', 'Women Empowerment',
  'Child Welfare', 'Elderly Care', 'Disaster Relief', 'Poverty Alleviation',
  'Rural Development', 'Animal Welfare', 'Human Rights', 'Other'
]

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    // Common fields
    fullName: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    // NGO specific
    ngoName: '',
    darpanId: '',
    npoType: '',
    registeredState: '',
    registeredDistrict: '',
    description: '',
    contactPerson: '',
    website: '',
    // Donor specific
    preferredCauses: [],
    // Volunteer specific
    skills: [],
    availability: {},
    experience: ''
  })

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && USER_TYPES.find(t => t.id === type)) {
      setSelectedType(type)
      setStep(2)
    }
  }, [searchParams])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType: selectedType
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-neutral-50 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2 sm:mb-4">
              Join Our Community
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600">
              Choose how you want to make a difference
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {USER_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 text-center p-4 sm:p-6"
                  onClick={() => {
                    setSelectedType(type.id)
                    setStep(2)
                  }}
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-${type.color}-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${type.color}-600`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                    {type.description}
                  </p>
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    Register as {type.title}
                  </Button>
                </Card>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            Register as {USER_TYPES.find(t => t.id === selectedType)?.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Fill in your details to create your account
          </p>
        </div>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType === 'ngo' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">NGO Information</h3>

                <Input
                  label="NGO Name"
                  value={formData.ngoName}
                  onChange={(e) => handleInputChange('ngoName', e.target.value)}
                  required
                />

                <Input
                  label="DARPAN ID"
                  value={formData.darpanId}
                  onChange={(e) => handleInputChange('darpanId', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    NPO Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.npoType}
                    onChange={(e) => handleInputChange('npoType', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select NPO Type</option>
                    {NPO_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <StateCitySelector
                  selectedState={formData.registeredState}
                  selectedCity={formData.registeredDistrict}
                  onStateChange={(state) => handleInputChange('registeredState', state)}
                  onCityChange={(city) => handleInputChange('registeredDistrict', city)}
                  stateLabel="Registered State"
                  cityLabel="Registered District/City"
                  required={true}
                />

                <Input
                  label="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                  <Input
                    label="Website (Optional)"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input-field"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="input-field"
                    rows={4}
                    placeholder="Describe your NGO's mission and activities..."
                  />
                </div>
              </div>
            )}

            {selectedType === 'donor' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Personal Information</h3>

                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />

                <StateCitySelector
                  selectedState={formData.state}
                  selectedCity={formData.city}
                  onStateChange={(state) => handleInputChange('state', state)}
                  onCityChange={(city) => handleInputChange('city', city)}
                  stateLabel="State"
                  cityLabel="City"
                  required={true}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    required
                    placeholder="Enter your full address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Preferred Causes (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {NPO_TYPES.map((cause) => (
                      <label key={cause} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.preferredCauses.includes(cause)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('preferredCauses', [...formData.preferredCauses, cause])
                            } else {
                              handleInputChange('preferredCauses', formData.preferredCauses.filter(c => c !== cause))
                            }
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>{cause}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedType === 'volunteer' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Personal Information</h3>

                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />

                <StateCitySelector
                  selectedState={formData.state}
                  selectedCity={formData.city}
                  onStateChange={(state) => handleInputChange('state', state)}
                  onCityChange={(city) => handleInputChange('city', city)}
                  stateLabel="State"
                  cityLabel="City"
                  required={true}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    required
                    placeholder="Enter your full address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Skills & Interests (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Teaching', 'Healthcare', 'Technology', 'Marketing', 'Event Management', 'Fundraising', 'Social Media', 'Photography', 'Writing', 'Translation', 'Legal', 'Accounting'].map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('skills', [...formData.skills, skill])
                            } else {
                              handleInputChange('skills', formData.skills.filter(s => s !== skill))
                            }
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Experience (Optional)
                  </label>
                  <textarea
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Describe your relevant experience and background..."
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Create Account
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center mt-6">
          <p className="text-neutral-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}