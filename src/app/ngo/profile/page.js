'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    User,
    FileText,
    Edit3,
    Save,
    Camera,
    Shield,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function NGOProfile() {
    const router = useRouter()
    const { user, loading, isAuthenticated } = useAuth('ngo')
    const [profile, setProfile] = useState({
        ngo_name: '',
        email: '',
        darpan_id: '',
        npo_type: '',
        registered_state: '',
        registered_district: '',
        description: '',
        contact_person: '',
        phone: '',
        address: '',
        website: '',
        logo_url: '',
        verification_status: 'pending',
        verification_notes: ''
    })
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        totalRaised: 0,
        activeVolunteers: 0,
        memberSince: ''
    })

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchProfile()
        }
    }, [isAuthenticated, user])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/ngo/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setProfile(data.profile)
                setStats(data.stats)
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to load profile')
            }
        } catch (error) {
            console.error('Auth check failed:', error)
            toast.error('Something went wrong')
        }
    }

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/ngo/profile', {
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
                fetchProfile() // Refresh data
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error('Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    const getVerificationStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100'
            case 'rejected': return 'text-red-600 bg-red-100'
            case 'pending': return 'text-yellow-600 bg-yellow-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getVerificationIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4" />
            case 'rejected': return <XCircle className="w-4 h-4" />
            case 'pending': return <Clock className="w-4 h-4" />
            default: return <Clock className="w-4 h-4" />
        }
    }

    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        router.push('/login')
        return null
    }

    return (
        <DashboardLayout userType="ngo" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">NGO Profile</h1>
                        <p className="text-neutral-600">Manage your organization information and settings</p>
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
                    {/* Profile Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-neutral-900">Organization Information</h2>
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-primary-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        NGO Name
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.ngo_name}
                                            onChange={(e) => handleInputChange('ngo_name', e.target.value)}
                                            placeholder="Enter NGO name"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.ngo_name || 'Not provided'}</p>
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
                                        DARPAN ID
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.darpan_id}
                                            onChange={(e) => handleInputChange('darpan_id', e.target.value)}
                                            placeholder="Enter DARPAN ID"
                                            className="font-mono"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 font-mono">{profile.darpan_id || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        NPO Type
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.npo_type}
                                            onChange={(e) => handleInputChange('npo_type', e.target.value)}
                                            placeholder="Enter NPO type"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.npo_type || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Registered State
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.registered_state}
                                            onChange={(e) => handleInputChange('registered_state', e.target.value)}
                                            placeholder="Enter registered state"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.registered_state || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Registered District
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.registered_district}
                                            onChange={(e) => handleInputChange('registered_district', e.target.value)}
                                            placeholder="Enter registered district"
                                        />
                                    ) : (
                                        <p className="text-neutral-900">{profile.registered_district || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Contact Information */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Contact Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Contact Person
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.contact_person}
                                            onChange={(e) => handleInputChange('contact_person', e.target.value)}
                                            placeholder="Enter contact person name"
                                        />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <User className="w-4 h-4 text-neutral-400" />
                                            <p className="text-neutral-900">{profile.contact_person || 'Not provided'}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Phone Number
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            <p className="text-neutral-900">{profile.phone || 'Not provided'}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Website
                                    </label>
                                    {editing ? (
                                        <Input
                                            value={profile.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            placeholder="Enter website URL"
                                        />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Globe className="w-4 h-4 text-neutral-400" />
                                            {profile.website ? (
                                                <a
                                                    href={profile.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 hover:underline"
                                                >
                                                    {profile.website}
                                                </a>
                                            ) : (
                                                <p className="text-neutral-900">Not provided</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Address & Description */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Address & Description</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Address
                                    </label>
                                    {editing ? (
                                        <textarea
                                            value={profile.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Enter organization address"
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

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Organization Description
                                    </label>
                                    {editing ? (
                                        <textarea
                                            value={profile.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Describe your organization's mission and activities"
                                            rows={4}
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    ) : (
                                        <div className="flex items-start space-x-2">
                                            <FileText className="w-4 h-4 text-neutral-400 mt-1" />
                                            <p className="text-neutral-900">{profile.description || 'No description provided'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Verification Status */}
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Verification Status</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-600">Current Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getVerificationStatusColor(profile.verification_status)}`}>
                                        {getVerificationIcon(profile.verification_status)}
                                        <span>{capitalize(profile.verification_status)}</span>
                                    </span>
                                </div>

                                {profile.verification_notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Verification Notes
                                        </label>
                                        <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">
                                            {profile.verification_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Organization Statistics</h2>

                            <div className="space-y-4">
                                <div className="border-t pt-4">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-neutral-600">Member Since</span>
                                    </div>
                                    <span className="text-lg font-medium text-neutral-900">
                                        {stats.memberSince ? new Date(stats.memberSince).getFullYear() : 'N/A'}
                                    </span>
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
                                    onClick={() => router.push('/ngo/campaigns')}
                                >
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Manage Campaigns
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/ngo/volunteers')}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    View Volunteers
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/ngo/donations')}
                                >
                                    <Building2 className="w-4 h-4 mr-2" />
                                    View Donations
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}