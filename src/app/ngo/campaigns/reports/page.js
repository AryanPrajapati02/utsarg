'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  Target,
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  Globe,
  Download
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import { downloadReportPDF } from '@/lib/pdfGenerator'

export default function NGOCampaignReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)

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
    // Filter reports
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.campaigns.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(report => report.campaign_id === campaignFilter)
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        filtered = filtered.filter(report => report.is_published)
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter(report => !report.is_published)
      }
    }

    setFilteredReports(filtered)
  }, [reports, searchTerm, campaignFilter, statusFilter])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch reports
      const reportsResponse = await fetch('/api/ngo/campaigns/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports)
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

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    setDeletingId(reportId)

    try {
      const response = await fetch(`/api/ngo/campaigns/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Report deleted successfully')
        setReports(prev => prev.filter(r => r.id !== reportId))
      } else {
        toast.error(data.error || 'Failed to delete report')
      }
    } catch (error) {
      console.error('Failed to delete report:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadReport = (report) => {
    try {
      const success = downloadReportPDF(report, report.campaigns, user?.ngoName)
      if (success) {
        toast.success('PDF report downloaded successfully')
      } else {
        toast.error('Failed to generate PDF report')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download report')
    }
  }



  const getReportTypeBadge = (type) => {
    const types = {
      utilization: { label: 'Fund Utilization', color: 'bg-blue-100 text-blue-800' },
      progress: { label: 'Progress Update', color: 'bg-green-100 text-green-800' },
      completion: { label: 'Completion Report', color: 'bg-purple-100 text-purple-800' }
    }
    
    const typeInfo = types[type] || types.utilization
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  const getStatusBadge = (isPublished) => {
    return isPublished ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Globe className="w-3 h-3 mr-1" />
        Published
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Draft
      </span>
    )
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
            <h1 className="text-2xl font-bold text-neutral-900">Campaign Reports</h1>
            <p className="text-neutral-600">Create transparency reports for your campaigns</p>
          </div>
          <Button onClick={() => router.push('/ngo/campaigns/reports/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Reports</p>
                <p className="text-2xl font-bold text-neutral-900">{reports.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Published</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {reports.filter(r => r.is_published).length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Drafts</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {reports.filter(r => !r.is_published).length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Campaigns Covered</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {new Set(reports.map(r => r.campaign_id)).size}
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
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </Card>

        {/* Reports List */}
        <div className="grid gap-6">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card key={report.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {report.title}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-2">
                          Campaign: {report.campaigns.title}
                        </p>
                        <div className="flex items-center space-x-3 mb-2">
                          {getReportTypeBadge(report.report_type)}
                          {getStatusBadge(report.is_published)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>

                          {report.amount_utilized && (
                            <span className="flex items-center">
                              <IndianRupee className="w-4 h-4 mr-1" />
                              ₹{report.amount_utilized.toLocaleString()} utilized
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-neutral-600 mb-4 line-clamp-2">
                      {report.description}
                    </p>

                    {/* Key Metrics */}
                    {(report.expenses && report.expenses.length > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Expense Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.expenses.slice(0, 3).map((expense, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-neutral-100 text-neutral-700">
                              {expense.category}: ₹{expense.amount?.toLocaleString()}
                            </span>
                          ))}
                          {report.expenses.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-neutral-100 text-neutral-700">
                              +{report.expenses.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/ngo/campaigns/reports/${report.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/ngo/campaigns/reports/edit/${report.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteReport(report.id)}
                      loading={deletingId === report.id}
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
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchTerm || campaignFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No reports found' 
                    : 'No reports yet'
                  }
                </h3>
                <p className="text-neutral-600 mb-6">
                  {searchTerm || campaignFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first transparency report to show how funds are being utilized.'
                  }
                </p>
                {(!searchTerm && campaignFilter === 'all' && statusFilter === 'all') && (
                  <Button onClick={() => router.push('/ngo/campaigns/reports/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Report
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