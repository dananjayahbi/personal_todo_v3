import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    console.log('Batch update received:', JSON.stringify(updates, null, 2))

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates must be an array" },
        { status: 400 }
      )
    }

    // Update tasks in a transaction to ensure data consistency
    await db.$transaction(
      updates.map((update: { id: string; order: number; status?: TaskStatus }) =>
        db.task.update({
          where: { id: update.id },
          data: {
            order: update.order,
            ...(update.status && { status: update.status }),
          },
        })
      )
    )

    return NextResponse.json({ message: "Tasks updated successfully" })
  } catch (error) {
    console.error("Error updating task orders:", error)
    return NextResponse.json(
      { error: "Failed to update task orders" },
      { status: 500 }
    )
  }
}
