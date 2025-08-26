import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, email } = await request.json()
    
    console.log('Change password request for email:', email)

    if (!currentPassword || !newPassword || !email) {
      return NextResponse.json(
        { error: 'Current password, new password, and email are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { email }
    })

    console.log('Found user:', user ? { id: user.id, email: user.email, name: user.name } : 'Not found')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check current password
    console.log('Comparing passwords:', { provided: currentPassword, stored: user.password })
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    console.log('About to update password for user:', email)
    
    // Update password in database
    const updatedUser = await db.user.update({
      where: { email },
      data: {
        password: newPassword,
      },
    })

    console.log('Password updated successfully for user:', updatedUser.email)

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
