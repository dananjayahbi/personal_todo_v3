import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const priorities = await db.priority.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        level: "asc",
      },
    })

    return NextResponse.json(priorities)
  } catch (error) {
    console.error("Error fetching priorities:", error)
    return NextResponse.json(
      { error: "Failed to fetch priorities" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, level, color } = body

    if (!name || level === undefined) {
      return NextResponse.json(
        { error: "Name and level are required" },
        { status: 400 }
      )
    }

    const priority = await db.priority.create({
      data: {
        name,
        level,
        color,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(priority, { status: 201 })
  } catch (error) {
    console.error("Error creating priority:", error)
    return NextResponse.json(
      { error: "Failed to create priority" },
      { status: 500 }
    )
  }
}