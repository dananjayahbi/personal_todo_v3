import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { TaskStatus } from "@prisma/client"
import { telegramService } from "@/lib/telegram/telegramService"

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
    const updatedTaskIds = await db.$transaction(
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

    // Send Telegram notifications for status changes
    if (telegramService.isConfigured()) {
      for (const update of updates) {
        // Only send notification if status was updated
        if (update.status) {
          try {
            // Get the updated task with full data for Telegram notification
            const task = await db.task.findUnique({
              where: { id: update.id },
              include: {
                project: true,
                priority: true,
                attachments: true,
                comments: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            });

            if (task) {
              await telegramService.sendTaskUpdatedNotification(
                { task },
                task.telegramMessageId || undefined
              );
            }
          } catch (error) {
            console.error(`Failed to send Telegram notification for task ${update.id}:`, error);
            // Don't fail the batch update if Telegram notification fails
          }
        }
      }
    }

    return NextResponse.json({ message: "Tasks updated successfully" })
  } catch (error) {
    console.error("Error updating task orders:", error)
    return NextResponse.json(
      { error: "Failed to update task orders" },
      { status: 500 }
    )
  }
}
