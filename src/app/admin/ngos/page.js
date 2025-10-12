'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Calendar
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function AdminNGOsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ngos, setNgos] = useState([])
  const [filteredNgos, setFilteredNgos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedNgo, setSelectedNgo] = useState(null)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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
        
        if (userData.role !== 'super_admin' && userData.role !== 'admin') {
          router.push('/login')
          return
        }
        
        setUser(userData)
        await fetchNGOs()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  useEffect(() => {
    // Filter NGOs based on search and status
    let filtered = ngos

    if (searchTerm) {
      filtered = filtered.filter(ngo => 
        ngo.ngo_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ngo.darpan_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ngo.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ngo => ngo.verification_status === statusFilter)
    }

    setFilteredNgos(filtered)
  }, [ngos, searchTerm, statusFilter])

  const fetchNGOs = async () => {
    try {
      const response = await fetch('/api/admin/ngos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNgos(data.ngos || [])
      } else {
        toast.error('Failed to load NGOs')
      }
    } catch (error) {
      console.error('Failed to fetch NGOs:', error)
      toast.error('Failed to load NGOs')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyNGO = async (ngoId, action) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/verify-ngo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          ngoId, 
          action,
          notes: verificationNotes 
        })
      })

      if (response.ok) {
        toast.success(`NGO ${action}d successfully`)
        setSelectedNgo(null)
        setVerificationNotes('')
        fetchNGOs()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update NGO status')
      }
    } catch (error) {
      console.error('Failed to verify NGO:', error)
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType={user?.role || "admin"} user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType={user?.role || "admin"} user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">NGO Management</h1>
            <p className="text-neutral-600">Review and manage NGO verifications</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Shield className="w-4 h-4" />
            <span>{ngos.filter(n => n.verification_status === 'pending').length} pending verifications</span>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search NGOs by name, DARPAN ID, or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field min-w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        {/* NGO List */}
        <div className="grid gap-6">
          {filteredNgos.length > 0 ? (
            filteredNgos.map((ngo) => (
              <Card key={ngo.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {ngo.ngo_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {ngo.npo_type}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(ngo.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {getStatusBadge(ngo.verification_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <strong className="w-24">DARPAN ID:</strong>
                          <span className="text-neutral-600">{ngo.darpan_id}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-neutral-400" />
                          <strong className="w-20">Contact:</strong>
                          <span className="text-neutral-600">{ngo.contact_person}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-neutral-400" />
                          <strong className="w-20">Email:</strong>
                          <span className="text-neutral-600">{ngo.users?.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-neutral-400" />
                          <strong className="w-20">Phone:</strong>
                          <span className="text-neutral-600">{ngo.phone}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
                          <strong className="w-20">Location:</strong>
                          <span className="text-neutral-600">
                            {ngo.registered_district}, {ngo.registered_state}
                          </span>
                        </div>
                        {ngo.website && (
                          <div className="flex items-center text-sm">
                            <strong className="w-20">Website:</strong>
                            <a 
                              href={ngo.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {ngo.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {ngo.description && (
                      <div className="mb-4">
                        <strong className="text-sm">Description:</strong>
                        <p className="text-sm text-neutral-600 mt-1">{ngo.description}</p>
                      </div>
                    )}

                    {ngo.verification_notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <strong className="text-sm text-yellow-800">Verification Notes:</strong>
                        <p className="text-sm text-yellow-700 mt-1">{ngo.verification_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedNgo(ngo)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No NGOs found</h3>
                <p className="text-neutral-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No NGOs have registered yet.'
                  }
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Verification Modal */}
        {selectedNgo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Review NGO: {selectedNgo.ngo_name}
                  </h2>
                  <button
                    onClick={() => setSelectedNgo(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Verification Notes (Optional)
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add notes about the verification decision..."
                      className="input-field w-full h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNgo(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  {selectedNgo.verification_status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleVerifyNGO(selectedNgo.id, 'reject')}
                        disabled={actionLoading}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleVerifyNGO(selectedNgo.id, 'approve')}
                        disabled={actionLoading}
                        loading={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}