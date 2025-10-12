'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload,
  FileText,
  IndianRupee,
  Users,
  Target,
  Save
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function EditCampaignReportPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [report, setReport] = useState(null)
  
  const [formData, setFormData] = useState({
    campaignId: '',
    reportType: 'utilization',
    title: '',
    description: '',
    amountUtilized: '',
    itemsUtilized: '',
    beneficiariesCount: '',
    expenses: [],
    achievements: '',
    challenges: '',
    nextSteps: '',
    images: [],
    documents: [],
    isPublished: false
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
      fetchData()
    } catch (error) {
      router.push('/login')
    }
  }, [router, reportId])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch report details
      const reportResponse = await fetch(`/api/ngo/campaigns/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData.report)
        
        // Populate form with existing data
        setFormData({
          campaignId: reportData.report.campaign_id,
          reportType: reportData.report.report_type,
          title: reportData.report.title,
          description: reportData.report.description,
          amountUtilized: reportData.report.amount_utilized?.toString() || '',
          itemsUtilized: reportData.report.items_utilized?.toString() || '',
          beneficiariesCount: reportData.report.beneficiaries_count?.toString() || '',
          expenses: reportData.report.expenses || [],
          achievements: reportData.report.achievements || '',
          challenges: reportData.report.challenges || '',
          nextSteps: reportData.report.next_steps || '',
          images: reportData.report.images || [],
          documents: reportData.report.documents || [],
          isPublished: reportData.report.is_published
        })
      } else {
        toast.error('Report not found')
        router.push('/ngo/campaigns/reports')
        return
      }

      // Fetch campaigns for dropdown
      const campaignsResponse = await fetch('/api/ngo/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData.campaigns.filter(c => c.status === 'active' || c.status === 'completed'))
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load report data')
      router.push('/ngo/campaigns/reports')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { category: '', amount: '', description: '', receipts: [] }]
    }))
  }

  const updateExpense = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map((expense, i) => 
        i === index ? { ...expense, [field]: value } : expense
      )
    }))
  }

  const removeExpense = (index) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.campaignId || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/ngo/campaigns/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          amountUtilized: formData.amountUtilized ? parseFloat(formData.amountUtilized) : null,
          itemsUtilized: formData.itemsUtilized ? parseInt(formData.itemsUtilized) : null,
          beneficiariesCount: formData.beneficiariesCount ? parseInt(formData.beneficiariesCount) : null,
          expenses: formData.expenses.filter(e => e.category && e.amount),
          achievements: formData.achievements || null,
          challenges: formData.challenges || null,
          nextSteps: formData.nextSteps || null,
          images: formData.images,
          documents: formData.documents,
          isPublished: formData.isPublished
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Report updated successfully')
        router.push('/ngo/campaigns/reports')
      } else {
        toast.error(data.error || 'Failed to update report')
      }
    } catch (error) {
      console.error('Failed to update report:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCampaign = campaigns.find(c => c.id === formData.campaignId)

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
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
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
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Edit Campaign Report</h1>
            <p className="text-neutral-600">Update your transparency report</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Campaign *
                  </label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => handleInputChange('campaignId', e.target.value)}
                    className="input-field"
                    required
                    disabled
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">Campaign cannot be changed after creation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => handleInputChange('reportType', e.target.value)}
                    className="input-field"
                  >
                    <option value="utilization">Fund Utilization</option>
                    <option value="progress">Progress Update</option>
                    <option value="completion">Completion Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Report Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Monthly Fund Utilization Report - December 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a detailed description of this report..."
                  className="input-field min-h-32"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Campaign Overview */}
          {selectedCampaign && (
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-neutral-900">Campaign Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Campaign Type</p>
                      <p className="font-medium">{selectedCampaign.campaign_type}</p>
                    </div>
                  </div>
                  
                  {selectedCampaign.campaign_type === 'money' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Funds Raised</p>
                        <p className="font-medium">₹{selectedCampaign.raised_amount?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  )}

                  {['clothes', 'food'].includes(selectedCampaign.campaign_type) && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-600">Items Collected</p>
                        <p className="font-medium">{selectedCampaign.collected_items || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Utilization Details */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">Utilization Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedCampaign?.campaign_type === 'money' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Amount Utilized (₹)
                    </label>
                    <Input
                      type="number"
                      value={formData.amountUtilized}
                      onChange={(e) => handleInputChange('amountUtilized', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                {['clothes', 'food'].includes(selectedCampaign?.campaign_type) && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Items Utilized
                    </label>
                    <Input
                      type="number"
                      value={formData.itemsUtilized}
                      onChange={(e) => handleInputChange('itemsUtilized', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Beneficiaries Count
                  </label>
                  <Input
                    type="number"
                    value={formData.beneficiariesCount}
                    onChange={(e) => handleInputChange('beneficiariesCount', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Expenses */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Expense Breakdown</h2>
                <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {formData.expenses.length > 0 ? (
                <div className="space-y-4">
                  {formData.expenses.map((expense, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-medium text-neutral-900">Expense {index + 1}</h3>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeExpense(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Category
                          </label>
                          <Input
                            value={expense.category}
                            onChange={(e) => updateExpense(index, 'category', e.target.value)}
                            placeholder="e.g., Medical Supplies, Food Distribution"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Amount (₹)
                          </label>
                          <Input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={expense.description}
                          onChange={(e) => updateExpense(index, 'description', e.target.value)}
                          placeholder="Describe how this amount was used..."
                          className="input-field min-h-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                  <IndianRupee className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-600">No expenses added yet</p>
                  <p className="text-sm text-neutral-500">Add expense categories to show fund utilization</p>
                </div>
              )}
            </div>
          </Card>

          {/* Additional Information */}
          <Card>
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">Additional Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Achievements
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => handleInputChange('achievements', e.target.value)}
                  placeholder="Describe key achievements and milestones reached..."
                  className="input-field min-h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Challenges
                </label>
                <textarea
                  value={formData.challenges}
                  onChange={(e) => handleInputChange('challenges', e.target.value)}
                  placeholder="Describe any challenges faced during implementation..."
                  className="input-field min-h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Next Steps
                </label>
                <textarea
                  value={formData.nextSteps}
                  onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                  placeholder="Outline planned next steps and future activities..."
                  className="input-field min-h-24"
                />
              </div>
            </div>
          </Card>

          {/* Publishing Options */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">Publishing Options</h2>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-neutral-700">
                  Publish this report publicly for transparency
                </label>
              </div>
              
              <p className="text-sm text-neutral-600">
                Published reports will be visible to all users and donors to ensure transparency in fund utilization.
              </p>
            </div>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Update Report
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}