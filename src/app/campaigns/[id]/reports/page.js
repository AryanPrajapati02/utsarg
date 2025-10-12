'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  FileText, 
  Calendar, 
  Users, 
  IndianRupee, 
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  Share2
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { downloadReportPDF } from '@/lib/pdfGenerator'

export default function CampaignReportsPage() {
  const params = useParams()
  const campaignId = params.id
  
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState(null)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignAndReports()
    }
  }, [campaignId])

  const fetchCampaignAndReports = async () => {
    try {
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${campaignId}`)
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json()
        setCampaign(campaignData.campaign)
      }

      // Fetch reports
      const reportsResponse = await fetch(`/api/campaigns/${campaignId}/reports`)
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports)
        if (reportsData.reports.length > 0) {
          setSelectedReport(reportsData.reports[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load campaign reports')
    } finally {
      setLoading(false)
    }
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

  const calculateUtilizationPercentage = (report) => {
    if (!campaign) return 0
    
    if (campaign.campaign_type === 'money' && campaign.raised_amount > 0) {
      return Math.min((report.amount_utilized / campaign.raised_amount) * 100, 100)
    } else if (['clothes', 'food'].includes(campaign.campaign_type) && campaign.collected_items > 0) {
      return Math.min((report.items_utilized / campaign.collected_items) * 100, 100)
    }
    
    return 0
  }

  const handleDownloadReport = (report) => {
    try {
      const success = downloadReportPDF(report, campaign, campaign?.ngo_profiles?.ngo_name)
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

  const handleShareReport = async (report) => {
    const shareUrl = window.location.href
    const shareText = `Check out this transparency report: ${report.title} by ${campaign.ngo_profiles?.ngo_name}`

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

  const generateReportContent = (report) => {
    if (!report || !campaign) return ''

    let content = `CAMPAIGN TRANSPARENCY REPORT\n`
    content += `================================\n\n`
    content += `Report Title: ${report.title}\n`
    content += `Campaign: ${campaign.title}\n`
    content += `NGO: ${campaign.ngo_profiles?.ngo_name}\n`
    content += `Report Type: ${report.report_type}\n`
    content += `Published: ${new Date(report.published_at).toLocaleDateString()}\n\n`

    content += `DESCRIPTION\n`
    content += `-----------\n`
    content += `${report.description}\n\n`

    if (report.amount_utilized || report.items_utilized) {
      content += `UTILIZATION SUMMARY\n`
      content += `-------------------\n`
      if (report.amount_utilized) {
        content += `Amount Utilized: ₹${report.amount_utilized.toLocaleString()}\n`
        if (campaign.raised_amount) {
          const percentage = Math.round(calculateUtilizationPercentage(report))
          content += `Utilization Rate: ${percentage}% of raised funds\n`
        }
      }
      if (report.items_utilized) {
        content += `Items Utilized: ${report.items_utilized.toLocaleString()}\n`
        if (campaign.collected_items) {
          const percentage = Math.round(calculateUtilizationPercentage(report))
          content += `Utilization Rate: ${percentage}% of collected items\n`
        }
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
        if (expense.bills && expense.bills.length > 0) {
          content += `   Supporting Documents: ${expense.bills.length} file(s) attached\n`
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

    content += `Campaign Details:\n`
    content += `Target: ${campaign.campaign_type === 'money' ? '₹' + campaign.target_amount?.toLocaleString() : campaign.target_items?.toLocaleString() + ' items'}\n`
    content += `Raised: ${campaign.campaign_type === 'money' ? '₹' + campaign.raised_amount?.toLocaleString() : campaign.collected_items?.toLocaleString() + ' items'}\n\n`

    content += `Generated on: ${new Date().toLocaleString()}\n`
    content += `View online: ${window.location.href}\n`
    return content
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Campaign not found</h3>
              <p className="text-neutral-600">The campaign you're looking for doesn't exist or has been removed.</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Transparency Reports</h1>
            <p className="text-lg text-neutral-600 mb-4">{campaign.title}</p>
            <p className="text-neutral-500 mb-6">
              By {campaign.ngo_profiles?.ngo_name} • {reports.length} report{reports.length !== 1 ? 's' : ''} published
            </p>
            
            {selectedReport && (
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReport(selectedReport)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareReport(selectedReport)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Report
                </Button>
              </div>
            )}
          </div>

          {/* Campaign Overview */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-neutral-900">Campaign Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">Campaign Type</p>
                  <p className="font-semibold text-neutral-900 capitalize">{campaign.campaign_type}</p>
                </div>

                {campaign.campaign_type === 'money' && (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IndianRupee className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">Target Amount</p>
                      <p className="font-semibold text-neutral-900">₹{campaign.target_amount?.toLocaleString()}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">Amount Raised</p>
                      <p className="font-semibold text-neutral-900">₹{campaign.raised_amount?.toLocaleString()}</p>
                    </div>
                  </>
                )}

                {['clothes', 'food'].includes(campaign.campaign_type) && (
                  <>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">Target Items</p>
                      <p className="font-semibold text-neutral-900">{campaign.target_items?.toLocaleString()}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">Items Collected</p>
                      <p className="font-semibold text-neutral-900">{campaign.collected_items?.toLocaleString()}</p>
                    </div>
                  </>
                )}

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">Reports Published</p>
                  <p className="font-semibold text-neutral-900">{reports.length}</p>
                </div>
              </div>
            </div>
          </Card>

          {reports.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Reports List */}
              <div className="lg:col-span-1">
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Published Reports</h3>
                    
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className={`group p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedReport?.id === report.id
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-neutral-900 text-sm line-clamp-2">
                                {report.title}
                              </h4>
                              <Eye className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-2" />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              {getReportTypeBadge(report.report_type)}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-neutral-600">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(report.published_at).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadReport(report)
                                  }}
                                  className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                                  title="Download report"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareReport(report)
                                  }}
                                  className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                                  title="Share report"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Report Details */}
              <div className="lg:col-span-2">
                {selectedReport && (
                  <Card>
                    <div className="space-y-6">
                      {/* Report Header */}
                      <div className="border-b border-neutral-200 pb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                              {selectedReport.title}
                            </h2>
                            <div className="flex items-center space-x-4 text-sm text-neutral-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Published on {new Date(selectedReport.published_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {getReportTypeBadge(selectedReport.report_type)}
                        </div>

                        <p className="text-neutral-700 leading-relaxed">
                          {selectedReport.description}
                        </p>
                      </div>

                      {/* Utilization Summary */}
                      {(selectedReport.amount_utilized || selectedReport.items_utilized) && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-neutral-900">Utilization Summary</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedReport.amount_utilized && (
                              <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-green-800">Amount Utilized</span>
                                  <span className="text-xs text-green-600">
                                    {Math.round(calculateUtilizationPercentage(selectedReport))}% of raised funds
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-green-900">
                                  ₹{selectedReport.amount_utilized.toLocaleString()}
                                </p>
                              </div>
                            )}

                            {selectedReport.items_utilized && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-blue-800">Items Utilized</span>
                                  <span className="text-xs text-blue-600">
                                    {Math.round(calculateUtilizationPercentage(selectedReport))}% of collected items
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">
                                  {selectedReport.items_utilized.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expense Breakdown */}
                      {selectedReport.expenses && selectedReport.expenses.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-neutral-900">Expense Breakdown</h3>
                          
                          <div className="space-y-3">
                            {selectedReport.expenses.map((expense, index) => (
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
                                ₹{selectedReport.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Achievements */}
                      {selectedReport.achievements && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            Achievements
                          </h3>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-neutral-700 leading-relaxed">{selectedReport.achievements}</p>
                          </div>
                        </div>
                      )}

                      {/* Challenges */}
                      {selectedReport.challenges && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            Challenges
                          </h3>
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-neutral-700 leading-relaxed">{selectedReport.challenges}</p>
                          </div>
                        </div>
                      )}

                      {/* Next Steps */}
                      {selectedReport.next_steps && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                            <ArrowRight className="w-5 h-5 text-blue-600 mr-2" />
                            Next Steps
                          </h3>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-neutral-700 leading-relaxed">{selectedReport.next_steps}</p>
                          </div>
                        </div>
                      )}

                      {/* Images */}
                      {selectedReport.images && selectedReport.images.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-neutral-900">Images</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedReport.images.map((image, index) => (
                              <div key={index} className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                                <img
                                  src={image}
                                  alt={`Report image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No reports published yet</h3>
                <p className="text-neutral-600">
                  The NGO hasn't published any transparency reports for this campaign yet.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}