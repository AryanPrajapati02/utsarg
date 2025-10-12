import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    console.log('🧪 Testing email configuration...')
    
    // Check environment variables
    const emailConfig = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '***HIDDEN***' : 'NOT SET',
    }
    
    console.log('📧 Email config:', emailConfig)
    
    // Test transporter creation
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    })
    
    console.log('🔧 Transporter created, testing connection...')
    
    // Verify connection
    const isConnected = await transporter.verify()
    console.log('✅ SMTP connection verified:', isConnected)
    
    // Send test email
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Test Email - Utsarg Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Test Successful!</h2>
          <p>This is a test email from your Utsarg platform.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
          <p><strong>Host:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</p>
        </div>
      `,
    }
    
    console.log('📤 Sending test email...')
    const result = await transporter.sendMail(testEmail)
    
    console.log('✅ Test email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    })
    
    return NextResponse.json({
      success: true,
      message: 'Email configuration test completed successfully',
      config: emailConfig,
      connectionVerified: isConnected,
      testEmailResult: {
        messageId: result.messageId,
        response: result.response,
        to: testEmail.to
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Email test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      config: {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}