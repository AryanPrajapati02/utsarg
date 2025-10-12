'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  FileText, 
  Calendar, 
  IndianRupee, 
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Share2,
  Eye,
  Edit,
  Globe,
  Clock
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { downloadReportPDF } from '@/lib/pdfGenerator'

export default function NGOViewReportPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)

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
      fetchReport()
    } catch (error) {
      router.push('/login')
    }
  }, [router, reportId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/ngo/campaigns/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      } else {
        toast.error('Report not found')
        router.push('/ngo/campaigns/reports')
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      toast.error('Failed to load report')
      router.push('/ngo/campaigns/reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const success = downloadReportPDF(report, report.campaigns, report.campaigns?.ngo_profiles?.ngo_name)
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/campaigns/${report.campaigns.id}/reports`
    const shareText = `Check out this transparency report: ${report.title}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Report link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  const generateReportContent = () => {
    if (!report) return ''

    let content = `CAMPAIGN TRANSPARENCY REPORT\n`
    content += `================================\n\n`
    content += `Report Title: ${report.title}\n`
    content += `Campaign: ${report.campaigns.title}\n`
    content += `Report Type: ${report.report_type}\n`
    content += `Created: ${new Date(report.created_at).toLocaleDateString()}\n`
    content += `Status: ${report.is_published ? 'Published' : 'Draft'}\n\n`

    content += `DESCRIPTION\n`
    content += `-----------\n`
    content += `${report.description}\n\n`

    if (report.amount_utilized || report.items_utilized) {
      content += `UTILIZATION SUMMARY\n`
      content += `-------------------\n`
      if (report.amount_utilized) {
        content += `Amount Utilized: ₹${report.amount_utilized.toLocaleString()}\n`
      }
      if (report.items_utilized) {
        content += `Items Utilized: ${report.items_utilized.toLocaleString()}\n`
      }
      content += `\n`
    }

    if (report.expenses && report.expenses.length > 0) {
      content += `EXPENSE BREAKDOWN\n`
      content += `-----------------\n`
      report.expenses.forEach((expense, index) => {
        content += `${index + 1}. ${expense.category}: ₹${expense.amount?.toLocaleString()}\n`
        if (expense.description) {
          content += `   Description: ${expense.description}\n`
        }
        content += `\n`
      })
      
      const totalExpenses = report.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
      content += `Total Expenses: ₹${totalExpenses.toLocaleString()}\n\n`
    }

    if (report.achievements) {
      content += `ACHIEVEMENTS\n`
      content += `------------\n`
      content += `${report.achievements}\n\n`
    }

    if (report.challenges) {
      content += `CHALLENGES\n`
      content += `----------\n`
      content += `${report.challenges}\n\n`
    }

    if (report.next_steps) {
      content += `NEXT STEPS\n`
      content += `----------\n`
      content += `${report.next_steps}\n\n`
    }

    content += `Generated on: ${new Date().toLocaleString()}\n`
    return content
  }

  const getReportTypeBadge = (type) => {
    const types = {
      utilization: { label: 'Fund Utilization', color: 'bg-blue-100 text-blue-800', icon: IndianRupee },
      progress: { label: 'Progress Update', color: 'bg-green-100 text-green-800', icon: TrendingUp },
      completion: { label: 'Completion Report', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
    }
    
    const typeInfo = types[type] || types.utilization
    const Icon = typeInfo.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
        <Icon className="w-4 h-4 mr-1" />
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

  if (!report) {
    return (
      <DashboardLayout userType="ngo" user={user}>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Report not found</h3>
            <p className="text-neutral-600 mb-6">The report you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/ngo/campaigns/reports')}>
              Back to Reports
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="ngo" user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/ngo/campaigns/reports')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">View Report</h1>
              <p className="text-neutral-600">Campaign: {report.campaigns.title}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={() => router.push(`/ngo/campaigns/reports/edit/${report.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Report
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                      {report.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created on {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      {report.is_published && (
                        <span className="flex items-center">
                          <Globe className="w-4 h-4 mr-1" />
                          Published on {new Date(report.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {getReportTypeBadge(report.report_type)}
                      {getStatusBadge(report.is_published)}
                    </div>
                  </div>
                </div>

                <p className="text-neutral-700 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </Card>

            {/* Utilization Summary */}
            {(report.amount_utilized || report.items_utilized) && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Utilization Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.amount_utilized && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800">Amount Utilized</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          ₹{report.amount_utilized.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {report.items_utilized && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Items Utilized</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {report.items_utilized.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Expense Breakdown */}
            {report.expenses && report.expenses.length > 0 && (
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Expense Breakdown</h3>
                  
                  <div className="space-y-3">
                    {report.expenses.map((expense, index) => (
                      <div key={index} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-neutral-900">{expense.category}</h4>
                          <span className="font-semibold text-neutral-900">
                            ₹{expense.amount?.toLocaleString()}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-neutral-600 mb-3">{expense.description}</p>
                        )}
                        
                        {/* Display Bills/Receipts */}
                        {expense.bills && expense.bills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-neutral-700 mb-2">Bills & Receipts:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {expense.bills.map((bill, billIndex) => (
                                <div key={billIndex} className="relative group cursor-pointer">
                                  <div className="border border-neutral-200 rounded-lg p-2 bg-white hover:shadow-md transition-shadow">
                                    {bill.type && bill.type.startsWith('image/') ? (
                                      <img
                                        src={bill.data}
                                        alt={bill.name}
                                        className="w-full h-16 object-cover rounded mb-1"
                                        onClick={() => window.open(bill.data, '_blank')}
                                      />
                                    ) : (
                                      <div 
                                        className="w-full h-16 bg-neutral-100 rounded mb-1 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                                        onClick={() => window.open(bill.data, '_blank')}
                                      >
                                        <FileText className="w-6 h-6 text-neutral-500" />
                                      </div>
                                    )}
                                    <p className="text-xs text-neutral-600 truncate">{bill.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900">Total Expenses</span>
                      <span className="text-lg font-bold text-neutral-900">
                        ₹{report.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Achievements */}
            {report.achievements && (
              <Card>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    Achievements
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-neutral-700 leading-relaxed">{report.achievements}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Challenges */}
            {report.challenges && (
              <Card>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    Challenges
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-neutral-700 leading-relaxed">{report.challenges}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Next Steps */}
            {report.next_steps && (
              <Card>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                    <ArrowRight className="w-5 h-5 text-blue-600 mr-2" />
                    Next Steps
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-neutral-700 leading-relaxed">{report.next_steps}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Campaign Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-600">Campaign</p>
                    <p className="font-medium text-neutral-900">{report.campaigns.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-600">Campaign Type</p>
                    <p className="font-medium text-neutral-900 capitalize">{report.campaigns.campaign_type}</p>
                  </div>

                  {report.campaigns.campaign_type === 'money' && (
                    <>
                      <div>
                        <p className="text-sm text-neutral-600">Target Amount</p>
                        <p className="font-medium text-neutral-900">₹{report.campaigns.target_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Amount Raised</p>
                        <p className="font-medium text-neutral-900">₹{report.campaigns.raised_amount?.toLocaleString()}</p>
                      </div>
                    </>
                  )}

                  {['clothes', 'food'].includes(report.campaigns.campaign_type) && (
                    <>
                      <div>
                        <p className="text-sm text-neutral-600">Target Items</p>
                        <p className="font-medium text-neutral-900">{report.campaigns.target_items?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Items Collected</p>
                        <p className="font-medium text-neutral-900">{report.campaigns.collected_items?.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/ngo/campaigns/reports/edit/${report.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Report
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`/campaigns/${report.campaigns.id}/reports`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-3" />
                    View Public Page
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-3" />
                    Download PDF
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    Share Report
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}