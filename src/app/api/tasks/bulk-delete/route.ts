import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskIds } = body

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid task IDs provided" },
        { status: 400 }
      )
    }

    // First, verify that all tasks belong to the user
    const tasks = await db.task.findMany({
      where: {
        id: {
          in: taskIds
        },
        user: {
          email: session.user.email
        }
      }
    })

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { error: "Some tasks not found or not accessible" },
        { status: 403 }
      )
    }

    // Delete all tasks in a transaction
    const deletedCount = await db.task.deleteMany({
      where: {
        id: {
          in: taskIds
        },
        user: {
          email: session.user.email
        }
      }
    })

    return NextResponse.json({ 
      message: `${deletedCount.count} tasks deleted successfully`,
      deletedCount: deletedCount.count
    })
  } catch (error) {
    console.error("Error bulk deleting tasks:", error)
    return NextResponse.json(
      { error: "Failed to delete tasks" },
      { status: 500 }
    )
  }
}
