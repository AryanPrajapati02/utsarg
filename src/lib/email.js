import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
})

export const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Utsarg - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Your OTP for email verification is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }

  const result = await transporter.sendMail(mailOptions)
  console.log('📧 OTP Email sent successfully:', {
    messageId: result.messageId,
    to: email,
    subject: mailOptions.subject,
    timestamp: new Date().toISOString()
  })
  return result
}

export const sendWelcomeEmail = async (email, name, userType) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Utsarg',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Utsarg!</h2>
        <p>Hello ${name},</p>
        <p>Welcome to our platform as a ${userType}. Your account has been successfully created.</p>
        <p>You can now start exploring and contributing to meaningful causes.</p>
        <p>Thank you for joining our community!</p>
      </div>
    `,
  }

  const result = await transporter.sendMail(mailOptions)
  console.log('📧 Welcome Email sent successfully:', {
    messageId: result.messageId,
    to: email,
    subject: mailOptions.subject,
    userType,
    timestamp: new Date().toISOString()
  })
  return result
}

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Utsarg - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your Utsarg account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">This is an automated email from Utsarg. Please do not reply to this email.</p>
      </div>
    `,
  }

  const result = await transporter.sendMail(mailOptions)
  console.log('🔐 Password Reset Email sent successfully:', {
    messageId: result.messageId,
    to: email,
    subject: mailOptions.subject,
    resetUrl,
    resetToken: resetToken.substring(0, 8) + '...', // Only log first 8 chars for security
    timestamp: new Date().toISOString()
  })
  return result
}

export const sendNotificationEmail = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${subject}</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          ${message}
        </div>
      </div>
    `,
  }

  const result = await transporter.sendMail(mailOptions)
  console.log('📬 Notification Email sent successfully:', {
    messageId: result.messageId,
    to: email,
    subject: mailOptions.subject,
    timestamp: new Date().toISOString()
  })
  return result
}