import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
            .select('user_type')
            .eq('id', decoded.userId)
            .single()

        if (!user || user.user_type !== 'donor') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months')) || 12

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        if (months === 'all') {
            startDate.setFullYear(2020) // Set to a very early date
        } else {
            startDate.setMonth(startDate.getMonth() - months)
        }

        // Get all donations for the user
        const { data: donations, error: donationsError } = await supabase
            .from('donations')
            .select(`
        id,
        amount,
        created_at,
        payment_status,
        donation_type,
        campaigns (
          id,
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
            .order('created_at', { ascending: false })

        if (donationsError) throw donationsError

        const completedDonations = donations?.filter(d => d.payment_status === 'completed') || []

        // Calculate summary statistics
        const totalDonated = completedDonations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
        const uniqueCampaigns = new Set(completedDonations.map(d => d.campaigns?.id).filter(Boolean))
        const campaignsSupported = uniqueCampaigns.size
        const livesImpacted = Math.floor(totalDonated / 500) + campaignsSupported * 5 // Estimated impact
        const impactScore = Math.floor(totalDonated / 1000) + campaignsSupported * 10

        // Generate monthly trends
        const monthlyTrends = []
        const monthlyData = {}

        completedDonations.forEach(donation => {
            const date = new Date(donation.created_at)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { amount: 0, count: 0 }
            }
            monthlyData[monthKey].amount += parseFloat(donation.amount) || 0
            monthlyData[monthKey].count += 1
        })

        Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([month, data]) => {
                const [year, monthNum] = month.split('-')
                const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                monthlyTrends.push({
                    month: monthName,
                    amount: Math.round(data.amount),
                    count: data.count
                })
            })

        // Category breakdown
        const categoryData = {}
        completedDonations.forEach(donation => {
            const category = donation.campaigns?.category || 'Other'
            if (!categoryData[category]) {
                categoryData[category] = { amount: 0, count: 0 }
            }
            categoryData[category].amount += parseFloat(donation.amount) || 0
            categoryData[category].count += 1
        })

        const categoryBreakdown = Object.entries(categoryData).map(([name, data]) => ({
            name,
            amount: Math.round(data.amount),
            count: data.count,
            percentage: totalDonated > 0 ? ((data.amount / totalDonated) * 100).toFixed(1) : 0
        })).sort((a, b) => b.amount - a.amount)

        // Top campaigns
        const campaignData = {}
        completedDonations.forEach(donation => {
            if (donation.campaigns) {
                const campaignId = donation.campaigns.id
                if (!campaignData[campaignId]) {
                    campaignData[campaignId] = {
                        id: campaignId,
                        title: donation.campaigns.title,
                        category: donation.campaigns.category,
                        ngo_name: donation.campaigns.ngos?.name || 'Unknown NGO',
                        location: `${donation.campaigns.ngos?.city || ''}, ${donation.campaigns.ngos?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Unknown',
                        your_donation: 0,
                        donation_count: 0
                    }
                }
                campaignData[campaignId].your_donation += parseFloat(donation.amount) || 0
                campaignData[campaignId].donation_count += 1
            }
        })

        const topCampaigns = Object.values(campaignData)
            .sort((a, b) => b.your_donation - a.your_donation)
            .slice(0, 10)
            .map(campaign => ({
                ...campaign,
                your_donation: Math.round(campaign.your_donation)
            }))

        // Geographic impact
        const stateData = {}
        completedDonations.forEach(donation => {
            if (donation.campaigns?.ngos?.state) {
                const state = donation.campaigns.ngos.state
                if (!stateData[state]) {
                    stateData[state] = {
                        state,
                        amount: 0,
                        campaigns: new Set(),
                        beneficiaries: 0
                    }
                }
                stateData[state].amount += parseFloat(donation.amount) || 0
                stateData[state].campaigns.add(donation.campaigns.id)
            }
        })

        const geographicImpact = Object.values(stateData).map(data => ({
            state: data.state,
            amount: Math.round(data.amount),
            campaigns: data.campaigns.size,
            beneficiaries: Math.floor(data.amount / 500) + data.campaigns.size * 5 // Estimated
        })).sort((a, b) => b.amount - a.amount)

        // Generate impact stories (mock data based on donations)
        const impactStories = topCampaigns.slice(0, 3).map((campaign, index) => ({
            title: `Impact Story ${index + 1}`,
            description: `Your donation of ₹${campaign.your_donation.toLocaleString()} to "${campaign.title}" helped provide essential support to the community.`,
            campaign: campaign.title,
            date: new Date().toLocaleDateString()
        }))

        return NextResponse.json({
            summary: {
                totalDonated: Math.round(totalDonated),
                campaignsSupported,
                impactScore,
                livesImpacted
            },
            monthlyTrends,
            categoryBreakdown,
            impactStories,
            topCampaigns,
            geographicImpact
        })

    } catch (error) {
        console.error('Donor reports API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        )
    }
}