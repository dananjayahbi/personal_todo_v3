import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Store OTPs temporarily (in production, use Redis or database)
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP (expires in 5 minutes)
    const otpStore = getOtpStore()
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    })

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_HOST_USER,
      to: email,
      subject: 'TaskPro - Password Reset Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>You requested a password reset for your TaskPro account.</p>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>TaskPro Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully' 
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please check your email configuration.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
