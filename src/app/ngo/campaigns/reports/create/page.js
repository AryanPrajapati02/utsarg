'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload,
  FileText,
  IndianRupee,
  Target
} from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

export default function CreateCampaignReportPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  
  const [formData, setFormData] = useState({
    campaignId: '',
    reportType: 'utilization',
    title: '',
    description: '',
    amountUtilized: '',
    itemsUtilized: '',
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
      fetchCampaigns()
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/ngo/campaigns', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns.filter(c => c.status === 'active' || c.status === 'completed'))
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast.error('Failed to load campaigns')
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
      expenses: [...prev.expenses, { category: '', amount: '', description: '', bills: [] }]
    }))
  }

  const handleFileUpload = (expenseIndex, files) => {
    const fileArray = Array.from(files)
    const filePromises = fileArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then(fileData => {
      setFormData(prev => ({
        ...prev,
        expenses: prev.expenses.map((expense, i) => 
          i === expenseIndex 
            ? { ...expense, bills: [...expense.bills, ...fileData] }
            : expense
        )
      }))
    })
  }

  const removeBill = (expenseIndex, billIndex) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map((expense, i) => 
        i === expenseIndex 
          ? { ...expense, bills: expense.bills.filter((_, bi) => bi !== billIndex) }
          : expense
      )
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
      const response = await fetch('/api/ngo/campaigns/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          campaignId: formData.campaignId,
          reportType: formData.reportType,
          title: formData.title,
          description: formData.description,
          amountUtilized: formData.amountUtilized ? parseFloat(formData.amountUtilized) : null,
          itemsUtilized: formData.itemsUtilized ? parseInt(formData.itemsUtilized) : null,
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
        toast.success('Report created successfully')
        router.push('/ngo/campaigns/reports')
      } else {
        toast.error(data.error || 'Failed to create report')
      }
    } catch (error) {
      console.error('Failed to create report:', error)
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
            <h1 className="text-2xl font-bold text-neutral-900">Create Campaign Report</h1>
            <p className="text-neutral-600">Create a transparency report for your campaign</p>
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
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      {/* Bill Upload Section */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Bills/Receipts
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-300 border-dashed rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-neutral-500" />
                                <p className="mb-2 text-sm text-neutral-500">
                                  <span className="font-semibold">Click to upload</span> bills or receipts
                                </p>
                                <p className="text-xs text-neutral-500">PNG, JPG, PDF up to 10MB each</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(index, e.target.files)}
                              />
                            </label>
                          </div>

                          {/* Display uploaded bills */}
                          {expense.bills && expense.bills.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-neutral-700">Uploaded Bills:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {expense.bills.map((bill, billIndex) => (
                                  <div key={billIndex} className="relative group">
                                    <div className="border border-neutral-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                                      {bill.type && bill.type.startsWith('image/') ? (
                                        <img
                                          src={bill.data}
                                          alt={bill.name}
                                          className="w-full h-20 object-cover rounded mb-2 cursor-pointer"
                                          onClick={() => window.open(bill.data, '_blank')}
                                        />
                                      ) : (
                                        <div 
                                          className="w-full h-20 bg-neutral-100 rounded mb-2 flex items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors"
                                          onClick={() => window.open(bill.data, '_blank')}
                                        >
                                          <FileText className="w-8 h-8 text-neutral-500" />
                                        </div>
                                      )}
                                      <p className="text-xs text-neutral-600 truncate" title={bill.name}>{bill.name}</p>
                                      <p className="text-xs text-neutral-500">{(bill.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeBill(index, billIndex)}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                      title="Remove bill"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
              {formData.isPublished ? 'Create & Publish Report' : 'Save as Draft'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}