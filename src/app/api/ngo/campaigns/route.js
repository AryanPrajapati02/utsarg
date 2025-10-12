import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Verify NGO authentication
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

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Fetch campaigns for this NGO
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('ngo_id', ngoProfile.id)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('NGO campaigns API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Verify NGO authentication
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

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const campaignData = await request.json()

    // Validate required fields
    if (!campaignData.title || !campaignData.description || !campaignData.category) {
      return NextResponse.json({ error: 'Missing required fields: title, description, and category are required' }, { status: 400 })
    }

    // Validate campaign type specific fields
    if (campaignData.campaign_type === 'money') {
      if (!campaignData.goal_amount || parseFloat(campaignData.goal_amount) <= 0) {
        return NextResponse.json({ error: 'Goal amount must be greater than 0 for money campaigns' }, { status: 400 })
      }
    } else if (campaignData.campaign_type !== 'money') {
      if (!campaignData.target_quantity || parseInt(campaignData.target_quantity) <= 0) {
        return NextResponse.json({ error: 'Target quantity must be greater than 0 for item campaigns' }, { status: 400 })
      }
    }

    // Validate dates
    if (campaignData.start_date && campaignData.end_date) {
      const startDate = new Date(campaignData.start_date)
      const endDate = new Date(campaignData.end_date)
      
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Prepare campaign data for insertion
    const insertData = {
      ngo_id: ngoProfile.id,
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category,
      campaign_type: campaignData.campaign_type || 'money',
      target_amount: campaignData.campaign_type === 'money' ? campaignData.goal_amount : null,
      target_items: campaignData.campaign_type !== 'money' ? campaignData.target_quantity : null,
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      location: campaignData.location || null,
      images: campaignData.image_url ? [campaignData.image_url] : null,
      status: campaignData.status || 'active'
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(insertData)
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json({ 
        error: 'Failed to create campaign',
        details: campaignError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaign
    })

  } catch (error) {
    console.error('Create campaign API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    // Verify NGO authentication
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

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const campaignData = await request.json()

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify campaign ownership
    const { data: existingCampaign, error: campaignCheckError } = await supabase
      .from('campaigns')
      .select('id, ngo_id')
      .eq('id', campaignId)
      .eq('ngo_id', ngoProfile.id)
      .single()

    if (campaignCheckError || !existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 })
    }

    // Prepare update data
    const updateData = {
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category,
      campaign_type: campaignData.campaign_type || 'money',
      target_amount: campaignData.campaign_type === 'money' ? campaignData.goal_amount : null,
      target_items: campaignData.campaign_type !== 'money' ? campaignData.target_quantity : null,
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      location: campaignData.location || null,
      images: campaignData.image_url ? [campaignData.image_url] : null,
      status: campaignData.status || 'active',
      updated_at: new Date().toISOString()
    }

    // Update campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update campaign',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error('Update campaign API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    // Verify NGO authentication
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

    if (!user || user.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('id')
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', decoded.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify campaign ownership and check if it has donations
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id, 
        ngo_id, 
        status,
        donations:donations(count)
      `)
      .eq('id', campaignId)
      .eq('ngo_id', ngoProfile.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 })
    }

    // Check if campaign has donations
    const { count: donationCount } = await supabase
      .from('donations')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaignId)

    if (donationCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete campaign with existing donations. You can only cancel it.' 
      }, { status: 400 })
    }

    // Delete campaign
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete campaign',
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign deleted successfully'
    })

  } catch (error) {
    console.error('Delete campaign API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}