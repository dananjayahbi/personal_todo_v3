import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // If userId looks like an email, find the user by email
    let actualUserId = userId
    if (userId.includes('@')) {
      const user = await db.user.findUnique({
        where: { email: userId }
      })
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      actualUserId = user.id
    }

    const projects = await db.project.findMany({
      where: {
        userId: actualUserId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, userId } = body

    if (!name || !userId) {
      return NextResponse.json(
        { error: "Name and user ID are required" },
        { status: 400 }
      )
    }

    // If userId looks like an email, find the user by email
    let actualUserId = userId
    if (userId.includes('@')) {
      const user = await db.user.findUnique({
        where: { email: userId }
      })
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      actualUserId = user.id
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        color,
        userId: actualUserId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}