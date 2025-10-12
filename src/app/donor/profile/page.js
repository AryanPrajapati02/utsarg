'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Heart,
    Calendar,
    Award,
    Edit3,
    Save,
    Camera,
    Shield,
    IndianRupee,
    Target
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import StateCitySelector from '@/components/ui/StateCitySelector'
import { toast } from 'react-hot-toast'

export default function DonorProfile() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        date_of_birth: '',
        occupation: '',
        interests: [],
        notification_preferences: {
            email_updates: true,
            sms_updates: false,
            campaign_recommendations: true,
            donation_receipts: true
        }
    })
    const [stats, setStats] = useState({
        totalDonated: 0,
        campaignsSupported: 0,
        impactScore: 0,
        memberSince: '',
        donorTier: 'Bronze'
    })

    const interestOptions = [
        'Education', 'Healthcare', 'Environment', 'Animal Welfare',
        'Disaster Relief', 'Poverty Alleviation', 'Women Empowerment',
        'Child Welfare', 'Elderly Care', 'Community Development'
    ]

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
                fetchProfile()
            } else {
                router.push('/login')
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            router.push('/login')
        }
    }

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/donor/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setProfile(data.profile)
                setStats(data.stats)
            } else {
                toast.error('Failed to load profile')
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const token = localStorage.getItem('token')

            const response = await fetch('/api/donor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            })

            if (response.ok) {
                toast.success('Profile updated successfully')
                setEditing(false)
            } else {
                const error = await response.json()
                toast.error(error.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error('Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleInterestToggle = (interest) => {
        setProfile(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }))
    }

    const handleNotificationChange = (key, value) => {
        setProfile(prev => ({
            ...prev,
            notification_preferences: {
                ...prev.notification_preferences,
                [key]: value
            }
        }))
    }

    const getDonorTierColor = (tier) => {
        switch (tier) {
            case 'Gold': return 'text-yellow-600 bg-yellow-100'
            case 'Silver': return 'text-gray-600 bg-gray-100'
            case 'Bronze': return 'text-orange-600 bg-orange-100'
            default: return 'text-blue-600 bg-blue-100'
        }
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
                        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
                        <p className="text-neutral-600">Manage your account information and preferences</p>
                    </div>
                    <div className="flex space-x-3">
                        {editing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    loading={saving}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setEditing(true)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-neutral-900">Basic Information</h2>
                                <div className="flex items-center space-x-2">
                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-primary-600" />
                                    </div>
                                    {editing && (
                                        <Button variant="ghost" size="sm">
                                            <Camera className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Full Name
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.full_name}
                                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.full_name || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Email
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4 text-neutral-400" />
                                        <p className="text-neutral-900">{profile.email}</p>
                                        <Shield className="w-4 h-4 text-green-600" title="Verified" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Phone Number
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="Enter your phone number"
                                        />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            <p className="text-neutral-900">{profile.phone || 'Not provided'}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Date of Birth
                                    </label>
                                    {editing ? (
                                        <Input
                                            type="date"
                                            value={profile.date_of_birth}
                                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                        />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-neutral-400" />
                                            <p className="text-neutral-900">
                                                {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Occupation
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.occupation}
                                            onChange={(e) => handleInputChange('occupation', e.target.value)}
                                            placeholder="Enter your occupation"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.occupation || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Address Information */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">
                                Address Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Address
                                    </label>
                                    {editing ? (
                                        <textarea
                                            value={profile.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Enter your address"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    ) : (
                                        <div className="flex items-start space-x-2">
                                            <MapPin className="w-4 h-4 text-neutral-400 mt-1" />
                                            <p className="text-neutral-900">{profile.address || 'Not provided'}</p>
                                        </div>
                                    )}
                                </div>

                                {editing ? (
                                    <StateCitySelector
                                        selectedState={profile.state}
                                        selectedCity={profile.city}
                                        onStateChange={(state) => handleInputChange('state', state)}
                                        onCityChange={(city) => handleInputChange('city', city)}
                                        stateLabel="State"
                                        cityLabel="City"
                                        disabled={!editing}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                State
                                            </label>
                                            <p className="text-neutral-900">{profile.state || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                                City
                                            </label>
                                            <p className="text-neutral-900">{profile.city || 'Not provided'}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Pincode
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.pincode}
                                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                                            placeholder="Enter pincode"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.pincode || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        </Card>


                        {/* Interests */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Interests & Causes</h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {interestOptions.map((interest) => (
                                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={profile.interests.includes(interest)}
                                            onChange={() => handleInterestToggle(interest)}
                                            disabled={!editing}
                                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-neutral-700">{interest}</span>
                                    </label>
                                ))}
                            </div>
                        </Card>

                        {/* Notification Preferences */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Notification Preferences</h2>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-neutral-700">Email Updates</span>
                                        <p className="text-xs text-neutral-500">Receive updates about your donations and campaigns</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profile.notification_preferences.email_updates}
                                        onChange={(e) => handleNotificationChange('email_updates', e.target.checked)}
                                        disabled={!editing}
                                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-neutral-700">SMS Updates</span>
                                        <p className="text-xs text-neutral-500">Receive SMS notifications for important updates</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profile.notification_preferences.sms_updates}
                                        onChange={(e) => handleNotificationChange('sms_updates', e.target.checked)}
                                        disabled={!editing}
                                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-neutral-700">Campaign Recommendations</span>
                                        <p className="text-xs text-neutral-500">Get personalized campaign suggestions</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profile.notification_preferences.campaign_recommendations}
                                        onChange={(e) => handleNotificationChange('campaign_recommendations', e.target.checked)}
                                        disabled={!editing}
                                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-neutral-700">Donation Receipts</span>
                                        <p className="text-xs text-neutral-500">Receive email receipts for your donations</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profile.notification_preferences.donation_receipts}
                                        onChange={(e) => handleNotificationChange('donation_receipts', e.target.checked)}
                                        disabled={!editing}
                                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </label>
                            </div>
                        </Card>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Donor Stats */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Donor Statistics</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600">Donor Tier</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDonorTierColor(stats.donorTier)}`}>
                                        {stats.donorTier}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600">Member Since</span>
                                    <span className="text-sm font-medium text-neutral-900">
                                        {stats.memberSince ? new Date(stats.memberSince).getFullYear() : 'N/A'}
                                    </span>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-neutral-600">Total Donated</p>
                                            <p className="text-lg font-semibold text-neutral-900">₹{stats.totalDonated.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 mb-3">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-neutral-600">Campaigns Supported</p>
                                            <p className="text-lg font-semibold text-neutral-900">{stats.campaignsSupported}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Award className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="text-sm text-neutral-600">Impact Score</p>
                                            <p className="text-lg font-semibold text-neutral-900">{stats.impactScore}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>

                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/donor/donations')}
                                >
                                    <Heart className="w-4 h-4 mr-2" />
                                    View My Donations
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/campaigns')}
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Browse Campaigns
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/donor/reports')}
                                >
                                    <Award className="w-4 h-4 mr-2" />
                                    Impact Reports
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div >
            </div >
        </DashboardLayout >
    )
}