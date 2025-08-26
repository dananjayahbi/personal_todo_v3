import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/password'

const prisma = new PrismaClient()

// External store for OTPs (should match the one in send-otp and verify-otp)
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
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
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

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove the used OTP
    otpStore.delete(email)

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedNewPassword,
      },
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully' 
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
