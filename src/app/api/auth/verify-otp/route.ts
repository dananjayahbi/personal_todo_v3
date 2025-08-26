import { NextRequest, NextResponse } from 'next/server'

// External store for OTPs (should match the one in send-otp)
declare global {
  var otpStore: Map<string, { otp: string, expires: number }> | undefined
}

const getOtpStore = () => {
  if (!global.otpStore) {
    global.otpStore = new Map()
  }
  return global.otpStore
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    const otpStore = getOtpStore()
    const storedOtpData = otpStore.get(email)

    if (!storedOtpData) {
      return NextResponse.json(
        { error: 'OTP not found or expired' },
        { status: 400 }
      )
    }

    if (Date.now() > storedOtpData.expires) {
      otpStore.delete(email)
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    if (storedOtpData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // OTP is valid, but don't delete it yet (we'll need it for password reset)
    return NextResponse.json({ 
      success: true,
      message: 'OTP verified successfully' 
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
