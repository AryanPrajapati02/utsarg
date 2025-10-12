'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  IndianRupee, 
  Calendar, 
  User,
  Target,
  Filter,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function NGODonationsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [filteredDonations, setFilteredDonations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedDonations: 0
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
      if (payload.user_type !== 'ngo' || !payload.isApproved) {
        router.push('/ngo/dashboard')
        return
      }
      setUser(payload)
      fetchDonations(payload.userId)
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    // Filter donations
    let filtered = donations

    if (searchTerm) {
      filtered = filtered.filter(donation => 
        donation.campaigns?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donor_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(donation => donation.payment_status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(donation => donation.donation_type === typeFilter)
    }

    setFilteredDonations(filtered)
  }, [donations, searchTerm, statusFilter, typeFilter])

  const fetchDonations = async (userId) => {
    try {
      const response = await fetch(`/api/ngo/donations?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Failed to load donations')
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'money':
        return <IndianRupee className="w-4 h-4 text-green-600" />
      case 'clothes':
        return <Target className="w-4 h-4 text-blue-600" />
      case 'food':
        return <Target className="w-4 h-4 text-orange-600" />
      case 'blood':
        return <Heart className="w-4 h-4 text-red-600" />
      default:
        return <Target className="w-4 h-4 text-gray-600" />
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
            <h1 className="text-2xl font-bold text-neutral-900">Donations</h1>
            <p className="text-neutral-600">Track and manage donations to your campaigns</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Amount</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>

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
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm font-medium text-neutral-600">Pending Amount</p>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by campaign or donor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field min-w-32"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field min-w-32"
              >
                <option value="all">All Types</option>
                <option value="money">Money</option>
                <option value="clothes">Clothes</option>
                <option value="food">Food</option>
                <option value="blood">Blood</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Donations List */}
        <div className="grid gap-4">
          {filteredDonations.length > 0 ? (
            filteredDonations.map((donation) => (
              <Card key={donation.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(donation.donation_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">
                        {donation.campaigns?.title || 'Unknown Campaign'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {donation.donor_profiles?.full_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(donation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {donation.donation_type === 'money' ? (
                        <p className="font-semibold text-green-600">
                          ₹{donation.amount?.toLocaleString() || 0}
                        </p>
                      ) : (
                        <p className="font-semibold text-blue-600">
                          {donation.quantity || 1} {donation.donation_type}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 capitalize">
                        {donation.donation_type}
                      </p>
                    </div>
                    {getStatusBadge(donation.payment_status)}
                  </div>
                </div>

                {donation.description && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600">{donation.description}</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No donations found' : 'No donations yet'}
                </h3>
                <p className="text-neutral-600">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Donations will appear here once people start supporting your campaigns.'
                  }
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}