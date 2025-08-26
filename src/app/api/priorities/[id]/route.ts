import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const priority = await db.priority.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!priority) {
      return NextResponse.json(
        { error: "Priority not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(priority)
  } catch (error) {
    console.error("Error fetching priority:", error)
    return NextResponse.json(
      { error: "Failed to fetch priority" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, level, color } = body

    const existingPriority = await db.priority.findUnique({
      where: {
        id,
      },
    })

    if (!existingPriority) {
      return NextResponse.json(
        { error: "Priority not found" },
        { status: 404 }
      )
    }

    // Check if level is already taken by another priority
    if (level !== undefined && level !== existingPriority.level) {
      const existingLevel = await db.priority.findFirst({
        where: {
          level: level,
          id: { not: id },
        },
      })

      if (existingLevel) {
        return NextResponse.json(
          { error: "Priority level already exists" },
          { status: 400 }
        )
      }
    }

    const updatedPriority = await db.priority.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPriority)
  } catch (error) {
    console.error("Error updating priority:", error)
    return NextResponse.json(
      { error: "Failed to update priority" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existingPriority = await db.priority.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!existingPriority) {
      return NextResponse.json(
        { error: "Priority not found" },
        { status: 404 }
      )
    }

    // Check if priority has associated tasks
    if (existingPriority._count.tasks > 0) {
      return NextResponse.json(
        { error: "Cannot delete priority with associated tasks" },
        { status: 400 }
      )
    }

    await db.priority.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: "Priority deleted successfully" })
  } catch (error) {
    console.error("Error deleting priority:", error)
    return NextResponse.json(
      { error: "Failed to delete priority" },
      { status: 500 }
    )
  }
}