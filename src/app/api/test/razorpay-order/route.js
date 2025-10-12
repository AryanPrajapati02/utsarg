import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { amount, currency = 'INR' } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    try {
      const Razorpay = require('razorpay')
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })

      const order = await razorpay.orders.create({
        amount: amount * 100, // Amount in paise
        currency: currency,
        receipt: `test_receipt_${Date.now()}`,
        notes: {
          test_mode: 'true',
          created_at: new Date().toISOString()
        }
      })

      return NextResponse.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      })

    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError)
      return NextResponse.json({
        error: 'Failed to create Razorpay order',
        details: razorpayError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test Razorpay order error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}