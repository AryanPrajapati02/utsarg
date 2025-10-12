import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    // Verify NGO authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || payload.user_type !== 'ngo' || !payload.isApproved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { volunteerId, status } = await request.json()

    if (!volunteerId || !status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Get NGO profile first
    const { data: ngoProfile } = await supabaseAdmin
      .from('ngo_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single()

    if (!ngoProfile) {
      return NextResponse.json({ error: 'NGO profile not found' }, { status: 404 })
    }

    // First try to find in volunteer_registrations (campaign-specific)
    let volunteerReg = null
    let isApplication = false
    let campaignTitle = null

    const { data: regData, error: regError } = await supabaseAdmin
      .from('volunteer_registrations')
      .select(`
        *,
        campaigns(title, ngo_id),
        volunteer_profiles(full_name, user_id),
        users!volunteer_profiles_user_id_fkey(email)
      `)
      .eq('id', volunteerId)
      .single()

    if (regData && !regError) {
      volunteerReg = regData
      campaignTitle = regData.campaigns?.title
      // Verify this volunteer belongs to the NGO's campaign
      if (volunteerReg.campaigns.ngo_id !== ngoProfile.id) {
        return NextResponse.json({ error: 'Unauthorized access to volunteer' }, { status: 403 })
      }
    } else {
      // Try to find in volunteer_applications (general NGO applications)
      const { data: appData, error: appError } = await supabaseAdmin
        .from('volunteer_applications')
        .select(`
          *,
          volunteer_profiles:users!volunteer_applications_volunteer_id_fkey(
            id,
            email,
            volunteer_profiles(full_name)
          )
        `)
        .eq('id', volunteerId)
        .single()

      if (appData && !appError) {
        volunteerReg = appData
        isApplication = true
        campaignTitle = 'General Volunteer Application'
        // Verify this application belongs to the NGO
        if (volunteerReg.ngo_id !== ngoProfile.id) {
          return NextResponse.json({ error: 'Unauthorized access to volunteer' }, { status: 403 })
        }
      }
    }

    if (!volunteerReg) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    // Update volunteer status in the appropriate table
    const tableName = isApplication ? 'volunteer_applications' : 'volunteer_registrations'
    const statusField = isApplication ? 
      (status === 'accepted' ? 'approved' : status === 'rejected' ? 'rejected' : status) : 
      status

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update({ 
        status: statusField,
        updated_at: new Date().toISOString()
      })
      .eq('id', volunteerId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Send email notification to volunteer
    try {
      const volunteerEmail = isApplication ? 
        volunteerReg.volunteer_profiles?.email : 
        volunteerReg.users?.email
      const volunteerName = isApplication ?
        volunteerReg.volunteer_profiles?.volunteer_profiles?.full_name :
        volunteerReg.volunteer_profiles?.full_name || 'Volunteer'

      if (volunteerEmail) {
        let subject, message

        switch (status) {
          case 'accepted':
            subject = `Volunteer Application Accepted - ${campaignTitle}`
            message = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Congratulations! Your volunteer application has been accepted</h2>
                <p>Dear ${volunteerName},</p>
                <p>We're excited to inform you that your application to volunteer for <strong>${campaignTitle}</strong> has been accepted!</p>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
                  <ul style="color: #374151;">
                    <li>The NGO will contact you with further details</li>
                    <li>You'll receive information about volunteer activities</li>
                    <li>Your contributions will be tracked and recognized</li>
                  </ul>
                </div>

                <p>Thank you for your willingness to make a positive impact!</p>
                <p>Best regards,<br>The Utsarg Team</p>
              </div>
            `
            break

          case 'rejected':
            subject = `Volunteer Application Update - ${campaignTitle}`
            message = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Volunteer Application Update</h2>
                <p>Dear ${volunteerName},</p>
                <p>Thank you for your interest in volunteering for <strong>${campaignTitle}</strong>.</p>
                <p>Unfortunately, we are unable to accept your application at this time due to capacity constraints or specific requirements.</p>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #374151; margin: 0;">We encourage you to:</p>
                  <ul style="color: #374151; margin-top: 10px;">
                    <li>Look for other volunteer opportunities on our platform</li>
                    <li>Follow this NGO for future opportunities</li>
                    <li>Consider supporting through donations</li>
                  </ul>
                </div>

                <p>Thank you for your commitment to making a difference!</p>
                <p>Best regards,<br>The Utsarg Team</p>
              </div>
            `
            break

          case 'completed':
            subject = `Thank You for Your Volunteer Service - ${campaignTitle}`
            message = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Thank You for Your Amazing Contribution!</h2>
                <p>Dear ${volunteerName},</p>
                <p>Your volunteer service for <strong>${campaignTitle}</strong> has been marked as completed.</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #059669; margin-top: 0;">Your Impact</h3>
                  <p style="color: #374151;">Your dedication and hard work have made a real difference in the lives of those we serve. Thank you for being part of our mission!</p>
                </div>

                <p>We hope you'll consider volunteering with us again in the future.</p>
                <p>With gratitude,<br>The Utsarg Team</p>
              </div>
            `
            break
        }

        await sendNotificationEmail(volunteerEmail, subject, message)
      }
    } catch (emailError) {
      console.error('Failed to send volunteer notification:', emailError)
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      message: `Volunteer ${status} successfully`,
      status
    })

  } catch (error) {
    console.error('Update volunteer status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}