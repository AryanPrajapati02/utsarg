'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  Target,
  Search,
  Filter
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function NGOBeneficiariesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.user_type !== 'ngo' || !payload.isApproved) {
        router.push('/ngo/dashboard')
        return
      }
      setUser(payload)
      fetchData()
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    // Filter beneficiaries
    let filtered = beneficiaries

    if (searchTerm) {
      filtered = filtered.filter(beneficiary => 
        beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.assistance_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(beneficiary => beneficiary.campaign_id === campaignFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(beneficiary => beneficiary.status === statusFilter)
    }

    setFilteredBeneficiaries(filtered)
  }, [beneficiaries, searchTerm, campaignFilter, statusFilter])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch beneficiaries
      const beneficiariesResponse = await fetch('/api/ngo/campaigns/beneficiaries', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (beneficiariesResponse.ok) {
        const beneficiariesData = await beneficiariesResponse.json()
        setBeneficiaries(beneficiariesData.beneficiaries)
      }

      // Fetch campaigns for filter
      const campaignsResponse = await fetch('/api/ngo/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData.campaigns)
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBeneficiary = async (beneficiaryId) => {
    if (!confirm('Are you sure you want to delete this beneficiary record? This action cannot be undone.')) {
      return
    }

    setDeletingId(beneficiaryId)

    try {
      const response = await fetch(`/api/ngo/campaigns/beneficiaries/${beneficiaryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Beneficiary deleted successfully')
        setBeneficiaries(prev => prev.filter(b => b.id !== beneficiaryId))
      } else {
        toast.error(data.error || 'Failed to delete beneficiary')
      }
    } catch (error) {
      console.error('Failed to delete beneficiary:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Completed
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Inactive
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="ngo" user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="ngo" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Beneficiaries</h1>
            <p className="text-neutral-600">Manage people helped by your campaigns</p>
          </div>
          <Button onClick={() => router.push('/ngo/campaigns/beneficiaries/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Beneficiary
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Beneficiaries</p>
                <p className="text-2xl font-bold text-neutral-900">{beneficiaries.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Active</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {beneficiaries.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Assistance</p>
                <p className="text-2xl font-bold text-neutral-900">
                  ₹{beneficiaries.reduce((sum, b) => sum + (b.amount_received || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">This Month</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {beneficiaries.filter(b => {
                    const createdDate = new Date(b.created_at)
                    const now = new Date()
                    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search beneficiaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="input-field min-w-48"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field min-w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        {/* Beneficiaries List */}
        <div className="grid gap-6">
          {filteredBeneficiaries.length > 0 ? (
            filteredBeneficiaries.map((beneficiary) => (
              <Card key={beneficiary.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {beneficiary.name}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-2">
                          Campaign: {beneficiary.campaigns.title}
                        </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusBadge(beneficiary.status)}
                          {beneficiary.assistance_type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {beneficiary.assistance_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          {beneficiary.age && (
                            <span>Age: {beneficiary.age}</span>
                          )}
                          {beneficiary.gender && (
                            <span className="capitalize">{beneficiary.gender}</span>
                          )}
                          {beneficiary.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {beneficiary.location}
                            </span>
                          )}
                          {beneficiary.assistance_date && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(beneficiary.assistance_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {beneficiary.assistance_details && (
                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {beneficiary.assistance_details}
                      </p>
                    )}

                    {/* Assistance Summary */}
                    <div className="flex items-center space-x-6 text-sm">
                      {beneficiary.amount_received && (
                        <div className="flex items-center text-green-600">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          ₹{beneficiary.amount_received.toLocaleString()} received
                        </div>
                      )}
                      {beneficiary.items_received && (
                        <div className="flex items-center text-blue-600">
                          <Target className="w-4 h-4 mr-1" />
                          {beneficiary.items_received} items received
                        </div>
                      )}
                      {beneficiary.contact_info?.phone && (
                        <div className="flex items-center text-neutral-600">
                          <Phone className="w-4 h-4 mr-1" />
                          {beneficiary.contact_info.phone}
                        </div>
                      )}
                      {beneficiary.contact_info?.email && (
                        <div className="flex items-center text-neutral-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {beneficiary.contact_info.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/ngo/campaigns/beneficiaries/${beneficiary.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/ngo/campaigns/beneficiaries/edit/${beneficiary.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                      loading={deletingId === beneficiary.id}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchTerm || campaignFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No beneficiaries found' 
                    : 'No beneficiaries yet'
                  }
                </h3>
                <p className="text-neutral-600 mb-6">
                  {searchTerm || campaignFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start adding beneficiaries to track the people helped by your campaigns.'
                  }
                </p>
                {(!searchTerm && campaignFilter === 'all' && statusFilter === 'all') && (
                  <Button onClick={() => router.push('/ngo/campaigns/beneficiaries/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Beneficiary
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}