import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    
    if (!payload || (payload.user_type !== 'super_admin' && payload.user_type !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ngoId, action, notes } = await request.json()

    if (!ngoId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Get NGO details
    const { data: ngoProfile, error: ngoError } = await supabaseAdmin
      .from('ngo_profiles')
      .select(`
        *,
        users!inner(email, id)
      `)
      .eq('id', ngoId)
      .single()

    if (ngoError || !ngoProfile) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      )
    }

    // Update NGO verification status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateError } = await supabaseAdmin
      .from('ngo_profiles')
      .update({
        verification_status: newStatus,
        verification_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ngoId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      )
    }

    // Update user approval status if approved
    if (action === 'approve') {
      await supabaseAdmin
        .from('users')
        .update({ is_approved: true })
        .eq('id', ngoProfile.users.id)
    }

    // Send email notification to NGO
    try {
      const subject = action === 'approve' 
        ? 'NGO Verification Approved - Welcome to Utsarg!'
        : 'NGO Verification Update - Utsarg'

      const message = action === 'approve' 
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Congratulations! Your NGO has been verified</h2>
            <p>Dear ${ngoProfile.contact_person},</p>
            <p>We're excited to inform you that <strong>${ngoProfile.ngo_name}</strong> has been successfully verified and approved on the Utsarg platform.</p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
              <ul style="color: #374151;">
                <li>You can now access your full NGO dashboard</li>
                <li>Create and manage fundraising campaigns</li>
                <li>Receive donations from supporters</li>
                <li>Connect with volunteers</li>
                <li>Track your impact and generate reports</li>
              </ul>
            </div>

            <p><strong>Your NGO Details:</strong></p>
            <ul>
              <li><strong>Organization:</strong> ${ngoProfile.ngo_name}</li>
              <li><strong>DARPAN ID:</strong> ${ngoProfile.darpan_id}</li>
              <li><strong>Type:</strong> ${ngoProfile.npo_type}</li>
              <li><strong>Location:</strong> ${ngoProfile.registered_district}, ${ngoProfile.registered_state}</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/ngo/dashboard" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>

            <p>Thank you for joining our mission to create positive social impact. Together, we can make a difference!</p>
            
            <p>Best regards,<br>The Utsarg Team</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">NGO Verification Update</h2>
            <p>Dear ${ngoProfile.contact_person},</p>
            <p>Thank you for your interest in joining the Utsarg platform. After reviewing your application for <strong>${ngoProfile.ngo_name}</strong>, we need to inform you that we require additional information or documentation.</p>
            
            ${notes ? `
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #dc2626; margin-top: 0;">Review Notes:</h3>
                <p style="color: #374151;">${notes}</p>
              </div>
            ` : ''}

            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Please review the feedback provided above</li>
              <li>Update your profile with the required information</li>
              <li>Contact our support team if you need assistance</li>
              <li>Resubmit your application when ready</li>
            </ul>

            <p>We're committed to maintaining high standards on our platform to ensure trust and transparency for all users.</p>
            
            <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The Utsarg Team</p>
          </div>
        `

      await sendNotificationEmail(ngoProfile.users.email, subject, message)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the verification if email fails
    }

    // Send notification to admin about the action
    try {
      const adminSubject = `NGO Verification ${action === 'approve' ? 'Approved' : 'Rejected'} - ${ngoProfile.ngo_name}`
      const adminMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">NGO Verification Action Completed</h2>
          <p>The following NGO verification has been ${action}d:</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>NGO Name:</strong> ${ngoProfile.ngo_name}</p>
            <p><strong>DARPAN ID:</strong> ${ngoProfile.darpan_id}</p>
            <p><strong>Contact Person:</strong> ${ngoProfile.contact_person}</p>
            <p><strong>Email:</strong> ${ngoProfile.users.email}</p>
            <p><strong>Action:</strong> ${action.toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          
          <p>The NGO has been notified via email about this decision.</p>
        </div>
      `

      await sendNotificationEmail(process.env.EMAIL_USER, adminSubject, adminMessage)
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError)
    }

    return NextResponse.json({
      message: `NGO ${action}d successfully`,
      status: newStatus
    })

  } catch (error) {
    console.error('NGO verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}