'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Award
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function NGOVolunteersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [volunteers, setVolunteers] = useState([])
  const [filteredVolunteers, setFilteredVolunteers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    activeVolunteers: 0,
    pendingApplications: 0,
    totalHours: 0
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
      fetchVolunteers(payload.userId)
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    // Filter volunteers
    let filtered = volunteers

    if (searchTerm) {
      filtered = filtered.filter(volunteer => 
        volunteer.volunteer_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.campaigns?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(volunteer => volunteer.status === statusFilter)
    }

    setFilteredVolunteers(filtered)
  }, [volunteers, searchTerm, statusFilter])

  const fetchVolunteers = async (userId) => {
    try {
      const response = await fetch(`/api/ngo/volunteers?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.volunteers)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch volunteers:', error)
      toast.error('Failed to load volunteers')
    } finally {
      setLoading(false)
    }
  }

  const updateVolunteerStatus = async (volunteerId, status) => {
    try {
      const response = await fetch('/api/ngo/volunteers/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ volunteerId, status })
      })

      if (response.ok) {
        toast.success(`Volunteer ${status} successfully`)
        fetchVolunteers(user.userId)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update volunteer status:', error)
      toast.error('Something went wrong')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status === 'approved' ? 'Approved' : 'Accepted'}
          </span>
        )
      case 'applied':
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {status === 'pending' ? 'Pending' : 'Applied'}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Award className="w-3 h-3 mr-1" />
            Completed
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
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Volunteers</h1>
          <p className="text-neutral-600">Manage volunteer applications and track contributions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Volunteers</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalVolunteers}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Active</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.activeVolunteers}</p>
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
                <p className="text-2xl font-bold text-neutral-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Hours</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalHours}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by volunteer name or campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field min-w-32"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Card>

        {/* Volunteers List */}
        <div className="grid gap-4">
          {filteredVolunteers.length > 0 ? (
            filteredVolunteers.map((volunteer) => (
              <Card key={volunteer.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900 mb-1">
                        {volunteer.type === 'application' 
                          ? volunteer.volunteer_profiles?.volunteer_profiles?.full_name 
                          : volunteer.volunteer_profiles?.full_name || 'Unknown Volunteer'}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          <span>
                            {volunteer.type === 'application' 
                              ? 'General Volunteer Application' 
                              : volunteer.campaigns?.title || 'Unknown Campaign'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Applied on {new Date(volunteer.created_at).toLocaleDateString()}</span>
                        </div>
                        {volunteer.hours_contributed > 0 && (
                          <div className="flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            <span>{volunteer.hours_contributed} hours contributed</span>
                          </div>
                        )}
                      </div>
                      
                      {volunteer.message && (
                        <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-700">
                            <strong>Message:</strong> {volunteer.message}
                          </p>
                        </div>
                      )}

                      {volunteer.volunteer_profiles?.experience && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-600">
                            <strong>Experience:</strong> {volunteer.volunteer_profiles.experience}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(volunteer.status)}
                    
                    {(volunteer.status === 'applied' || volunteer.status === 'pending') && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVolunteerStatus(volunteer.id, 'rejected')}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateVolunteerStatus(volunteer.id, 'accepted')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                      </div>
                    )}

                    {(volunteer.status === 'accepted' || volunteer.status === 'approved') && volunteer.type === 'campaign' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVolunteerStatus(volunteer.id, 'completed')}
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No volunteers found' : 'No volunteers yet'}
                </h3>
                <p className="text-neutral-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Volunteer applications will appear here when people apply to help with your campaigns.'
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