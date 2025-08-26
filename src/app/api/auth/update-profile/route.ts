import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // For this demo, we'll get the user from the request body
    // In a real app, you would get it from the session
    
    const { name, email, currentEmail } = await request.json()
    
    console.log('Update profile request:', { name, email, currentEmail })

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!email || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!currentEmail) {
      return NextResponse.json(
        { error: 'Current email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // If email is being changed, check if it's already taken
    if (currentEmail !== email) {
      const existingUser = await db.user.findUnique({
        where: { email }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        )
      }
    }

    console.log('About to update user with currentEmail:', currentEmail)
    
    // Update user in database
    const updatedUser = await db.user.update({
      where: { email: currentEmail },
      data: {
        name,
        email,
      },
    })

    console.log('User updated successfully:', updatedUser)

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
