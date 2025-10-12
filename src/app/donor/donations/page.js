'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  IndianRupee, 
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Droplets,
  Shirt,
  UtensilsCrossed
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function DonorDonationsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [stats, setStats] = useState({
    totalDonations: 0,
    completedDonations: 0,
    pendingDonations: 0,
    totalAmount: 0,
    donationTypes: {}
  })
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.user_type !== 'donor') {
        router.push('/login')
        return
      }
      setUser(payload)
      fetchDonations()
    } catch (error) {
      router.push('/login')
    }
  }, [router, filters, pagination.page])

  const fetchDonations = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)

      const response = await fetch(`/api/donor/donations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations)
        setStats(data.stats)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        toast.error('Failed to load donations')
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
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

  const getDonationTypeIcon = (type) => {
    switch (type) {
      case 'money':
        return <IndianRupee className="w-4 h-4 text-green-600" />
      case 'clothes':
        return <Shirt className="w-4 h-4 text-blue-600" />
      case 'food':
        return <UtensilsCrossed className="w-4 h-4 text-orange-600" />
      case 'blood':
        return <Droplets className="w-4 h-4 text-red-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
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
            <h1 className="text-2xl font-bold text-neutral-900">My Donations</h1>
            <p className="text-neutral-600">Track all your contributions and their impact</p>
          </div>
          <Button onClick={() => router.push('/campaigns')}>
            <Heart className="w-4 h-4 mr-2" />
            Make New Donation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Donations</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalDonations}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Completed</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.completedDonations}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Pending</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.pendingDonations}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Amount</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by campaign name or NGO..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field min-w-32"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-field min-w-32"
            >
              <option value="">All Types</option>
              <option value="money">Money</option>
              <option value="clothes">Clothes</option>
              <option value="food">Food</option>
              <option value="blood">Blood</option>
            </select>
          </div>
        </Card>

        {/* Donations List */}
        <div className="space-y-4">
          {donations.length > 0 ? (
            donations.map((donation) => (
              <Card key={donation.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getDonationTypeIcon(donation.donation_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900 mb-1">
                        {donation.campaign.title}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-2">
                        by {donation.campaign.ngo_name}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                          {donation.campaign.category}
                        </span>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(donation.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {donation.description && (
                        <p className="text-sm text-neutral-600 mb-2">
                          <strong>Note:</strong> {donation.description}
                        </p>
                      )}

                      {donation.razorpay_payment_id && (
                        <p className="text-xs text-neutral-500">
                          Payment ID: {donation.razorpay_payment_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(donation.payment_status)}
                    
                    <div className="text-right">
                      {donation.donation_type === 'money' && donation.amount && (
                        <p className="text-lg font-semibold text-green-600">
                          ₹{parseFloat(donation.amount).toLocaleString()}
                        </p>
                      )}
                      {donation.quantity && (
                        <p className="text-sm text-neutral-600">
                          Qty: {donation.quantity}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 capitalize">
                        {donation.donation_type}
                      </p>
                    </div>

                    {donation.delivery_status && donation.donation_type !== 'money' && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        donation.delivery_status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : donation.delivery_status === 'collected'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {donation.delivery_status}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {Object.values(filters).some(f => f) ? 'No donations found' : 'No donations yet'}
                </h3>
                <p className="text-neutral-600 mb-4">
                  {Object.values(filters).some(f => f)
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start making a difference by donating to campaigns you care about.'
                  }
                </p>
                <Button onClick={() => router.push('/campaigns')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Browse Campaigns
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} donations
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-neutral-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}