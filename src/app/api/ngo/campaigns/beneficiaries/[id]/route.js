import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: beneficiaryId } = await params

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Get beneficiary with campaign info
    const { data: beneficiary, error } = await supabaseAdmin
      .from('beneficiaries')
      .select(`
        *,
        campaigns!inner(
          id,
          title,
          ngo_id,
          campaign_type
        ),
        campaign_reports(
          id,
          title
        )
      `)
      .eq('id', beneficiaryId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (error || !beneficiary) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })
    }

    return NextResponse.json({ beneficiary })

  } catch (error) {
    console.error('Beneficiary fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: beneficiaryId } = await params
    const body = await request.json()
    const {
      name,
      age,
      gender,
      location,
      contactInfo,
      assistanceType,
      assistanceDetails,
      assistanceDate,
      amountReceived,
      itemsReceived,
      status,
      notes
    } = body

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify beneficiary belongs to this NGO
    const { data: existingBeneficiary, error: beneficiaryError } = await supabaseAdmin
      .from('beneficiaries')
      .select(`
        id,
        campaigns!inner(ngo_id)
      `)
      .eq('id', beneficiaryId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (beneficiaryError || !existingBeneficiary) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })
    }

    // Update beneficiary
    const { data: beneficiary, error: updateError } = await supabaseAdmin
      .from('beneficiaries')
      .update({
        name,
        age: age || null,
        gender: gender || null,
        location: location || null,
        contact_info: contactInfo || {},
        assistance_type: assistanceType || null,
        assistance_details: assistanceDetails || null,
        assistance_date: assistanceDate || null,
        amount_received: amountReceived || null,
        items_received: itemsReceived || null,
        status: status || 'active',
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', beneficiaryId)
      .select()
      .single()

    if (updateError) {
      console.error('Beneficiary update error:', updateError)
      return NextResponse.json({ error: 'Failed to update beneficiary' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Beneficiary updated successfully',
      beneficiary
    })

  } catch (error) {
    console.error('Beneficiary update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.user_type !== 'ngo') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const beneficiaryId = params.id

    // Get NGO profile
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // Verify beneficiary belongs to this NGO
    const { data: beneficiary, error: beneficiaryError } = await supabaseAdmin
      .from('beneficiaries')
      .select(`
        id,
        campaigns!inner(ngo_id)
      `)
      .eq('id', beneficiaryId)
      .eq('campaigns.ngo_id', ngoProfile.id)
      .single()

    if (beneficiaryError || !beneficiary) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })
    }

    // Delete beneficiary
    const { error: deleteError } = await supabaseAdmin
      .from('beneficiaries')
      .delete()
      .eq('id', beneficiaryId)

    if (deleteError) {
      console.error('Beneficiary deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete beneficiary' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Beneficiary deleted successfully' })

  } catch (error) {
    console.error('Beneficiary deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}