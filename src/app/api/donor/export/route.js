import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generatePDFContent(data, type) {
  // This is a simplified PDF generation - in production, you'd use a proper PDF library
  let content = `DONOR ${type.toUpperCase()} REPORT\n`
  content += `Generated on: ${new Date().toLocaleDateString()}\n\n`
  
  switch (type) {
    case 'summary':
      content += `SUMMARY STATISTICS\n`
      content += `Total Donated: ₹${data.summary.totalDonated.toLocaleString()}\n`
      content += `Campaigns Supported: ${data.summary.campaignsSupported}\n`
      content += `Impact Score: ${data.summary.impactScore}\n`
      content += `Lives Impacted: ${data.summary.livesImpacted}\n\n`
      
      content += `CATEGORY BREAKDOWN\n`
      data.categoryBreakdown.forEach(cat => {
        content += `${cat.name}: ₹${cat.amount.toLocaleString()} (${cat.percentage}%)\n`
      })
      break
      
    case 'detailed':
      content += `DETAILED DONATION HISTORY\n\n`
      data.topCampaigns.forEach(campaign => {
        content += `Campaign: ${campaign.title}\n`
        content += `NGO: ${campaign.ngo_name}\n`
        content += `Your Donation: ₹${campaign.your_donation.toLocaleString()}\n`
        content += `Category: ${campaign.category}\n`
        content += `Location: ${campaign.location}\n\n`
      })
      break
      
    case 'tax':
      content += `TAX DEDUCTION CERTIFICATE\n\n`
      content += `This certifies that the donor has made charitable donations\n`
      content += `totaling ₹${data.summary.totalDonated.toLocaleString()} during the specified period.\n\n`
      content += `This amount is eligible for tax deduction under Section 80G\n`
      content += `of the Income Tax Act, 1961.\n\n`
      break
      
    case 'impact':
      content += `IMPACT REPORT\n\n`
      content += `Your contributions have made a significant difference:\n\n`
      data.impactStories.forEach(story => {
        content += `${story.title}\n`
        content += `${story.description}\n`
        content += `Campaign: ${story.campaign}\n\n`
      })
      break
      
    default:
      content += `Complete donation and impact report\n`
  }
  
  return content
}

export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify user role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.role !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const months = searchParams.get('months') || '12'

    // Get report data (reuse logic from reports API)
    const endDate = new Date()
    const startDate = new Date()
    if (months === 'all') {
      startDate.setFullYear(2020)
    } else {
      startDate.setMonth(startDate.getMonth() - parseInt(months))
    }

    // Get donations data
    const { data: donations } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        created_at,
        payment_status,
        campaigns (
          title,
          category,
          ngos (
            name,
            city,
            state
          )
        )
      `)
      .eq('user_id', decoded.userId)
      .gte('created_at', startDate.toISOString())
      .eq('payment_status', 'completed')

    const completedDonations = donations || []
    const totalDonated = completedDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    const uniqueCampaigns = new Set(completedDonations.map(d => d.campaigns?.title).filter(Boolean))
    
    // Generate report data
    const reportData = {
      summary: {
        totalDonated: Math.round(totalDonated),
        campaignsSupported: uniqueCampaigns.size,
        impactScore: Math.floor(totalDonated / 1000) + uniqueCampaigns.size * 10,
        livesImpacted: Math.floor(totalDonated / 500) + uniqueCampaigns.size * 5
      },
      categoryBreakdown: [],
      topCampaigns: [],
      impactStories: [
        {
          title: 'Education Support',
          description: 'Your donations helped provide educational materials to underprivileged children.',
          campaign: 'Education for All'
        },
        {
          title: 'Healthcare Access',
          description: 'Your contributions enabled medical treatment for families in need.',
          campaign: 'Health for Everyone'
        }
      ]
    }

    // Generate category breakdown
    const categoryData = {}
    completedDonations.forEach(donation => {
      const category = donation.campaigns?.category || 'Other'
      if (!categoryData[category]) {
        categoryData[category] = 0
      }
      categoryData[category] += parseFloat(donation.amount) || 0
    })

    reportData.categoryBreakdown = Object.entries(categoryData).map(([name, amount]) => ({
      name,
      amount: Math.round(amount),
      percentage: totalDonated > 0 ? ((amount / totalDonated) * 100).toFixed(1) : 0
    }))

    // Generate top campaigns
    const campaignData = {}
    completedDonations.forEach(donation => {
      if (donation.campaigns) {
        const title = donation.campaigns.title
        if (!campaignData[title]) {
          campaignData[title] = {
            title,
            ngo_name: donation.campaigns.ngos?.name || 'Unknown NGO',
            category: donation.campaigns.category,
            location: `${donation.campaigns.ngos?.city || ''}, ${donation.campaigns.ngos?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Unknown',
            your_donation: 0
          }
        }
        campaignData[title].your_donation += parseFloat(donation.amount) || 0
      }
    })

    reportData.topCampaigns = Object.values(campaignData)
      .sort((a, b) => b.your_donation - a.your_donation)
      .slice(0, 10)
      .map(campaign => ({
        ...campaign,
        your_donation: Math.round(campaign.your_donation)
      }))

    // Generate PDF content
    const pdfContent = generatePDFContent(reportData, type)

    // Return as text file (in production, use proper PDF generation)
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="donor_${type}_report_${new Date().toISOString().split('T')[0]}.txt"`
      }
    })

  } catch (error) {
    console.error('Donor export API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}