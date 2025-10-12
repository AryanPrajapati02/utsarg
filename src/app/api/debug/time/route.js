import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date()
  
  return NextResponse.json({
    serverTime: now.toISOString(),
    localTime: now.toString(),
    timestamp: now.getTime()
  })
}