import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Verify admin authentication
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

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'super_admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch dashboard statistics
    const [
      usersResult,
      ngosResult,
      campaignsResult,
      donationsResult,
      pendingNGOsResult
    ] = await Promise.allSettled([
      // Total users
      supabase
        .from('users')
        .select('id, created_at, user_type')
        .neq('user_type', 'super_admin'),
      
      // NGO statistics
      supabase
        .from('ngo_profiles')
        .select('id, verification_status, created_at'),
      
      // Campaign statistics
      supabase
        .from('campaigns')
        .select('id, status, created_at'),
      
      // Donation statistics
      supabase
        .from('donations')
        .select('amount, created_at, payment_status'),
      
      // Pending NGO verifications
      supabase
        .from('ngo_profiles')
        .select(`
          id,
          ngo_name,
          darpan_id,
          npo_type,
          registered_state,
          registered_district,
          contact_person,
          phone,
          created_at,
          verification_status
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Extract data from Promise.allSettled results
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
    const ngosData = ngosResult.status === 'fulfilled' ? ngosResult.value.data : [];
    const campaignsData = campaignsResult.status === 'fulfilled' ? campaignsResult.value.data : [];
    const donationsData = donationsResult.status === 'fulfilled' ? donationsResult.value.data : [];
    const pendingNGOsData = pendingNGOsResult.status === 'fulfilled' ? pendingNGOsResult.value.data : [];

    // Debug logging
    console.log('Admin Dashboard Debug:', {
      usersCount: usersData?.length || 0,
      ngosCount: ngosData?.length || 0,
      campaignsCount: campaignsData?.length || 0,
      donationsCount: donationsData?.length || 0,
      usersError: usersResult.status === 'rejected' ? usersResult.reason : null,
      ngosError: ngosResult.status === 'rejected' ? ngosResult.reason : null,
      campaignsError: campaignsResult.status === 'rejected' ? campaignsResult.reason : null,
      donationsError: donationsResult.status === 'rejected' ? donationsResult.reason : null,
      pendingNGOsError: pendingNGOsResult.status === 'rejected' ? pendingNGOsResult.reason : null
    });

    // Calculate statistics
    const totalUsers = usersData?.length || 0
    const totalNGOs = ngosData?.length || 0
    const verifiedNGOs = ngosData?.filter(ngo => ngo.verification_status === 'approved').length || 0
    const pendingNGOs = ngosData?.filter(ngo => ngo.verification_status === 'pending').length || 0
    const totalCampaigns = campaignsData?.length || 0
    const activeCampaigns = campaignsData?.filter(campaign => campaign.status === 'active').length || 0
    
    // Calculate total donations
    const completedDonations = donationsData?.filter(d => d.payment_status === 'completed') || []
    const totalDonations = completedDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0)
    
    // Calculate active users (users who joined in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = usersData?.filter(user => 
      new Date(user.created_at) > thirtyDaysAgo
    ).length || 0

    // Generate recent activity
    const recentActivity = []
    
    // Add recent user registrations
    const recentUsers = usersData?.slice(-5) || []
    recentUsers.forEach(user => {
      recentActivity.push({
        type: 'registration',
        description: `New ${user.user_type} registered`,
        timestamp: new Date(user.created_at).toLocaleDateString()
      })
    })

    // Add recent donations
    const recentDonations = completedDonations.slice(-3) || []
    recentDonations.forEach(donation => {
      recentActivity.push({
        type: 'donation',
        description: `₹${donation.amount?.toLocaleString()} donation received`,
        timestamp: new Date(donation.created_at).toLocaleDateString()
      })
    })

    // Add recent campaigns
    const recentCampaigns = campaignsData?.slice(-2) || []
    recentCampaigns.forEach(campaign => {
      recentActivity.push({
        type: 'campaign',
        description: `New campaign created`,
        timestamp: new Date(campaign.created_at).toLocaleDateString()
      })
    })

    // Sort activity by date
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return NextResponse.json({
      stats: {
        totalUsers,
        totalNGOs,
        verifiedNGOs,
        pendingNGOs,
        totalCampaigns,
        activeCampaigns,
        totalDonations,
        activeUsers,
        platformRevenue: Math.round(totalDonations * 0.02) // 2% platform fee
      },
      pendingVerifications: pendingNGOsData || [],
      recentActivity: recentActivity.slice(0, 10)
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}