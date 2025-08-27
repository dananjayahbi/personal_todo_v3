import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { telegramService } from "@/lib/telegram/telegramService"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await db.task.findUnique({
      where: {
        id,
      },
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
    })

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const {
      title,
      description,
      dueDate,
      priorityId,
      projectId,
      status,
      order,
      attachments,
    } = body

    const existingTask = await db.task.findUnique({
      where: {
        id,
      },
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
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Use a transaction to update task and handle attachments
    const updatedTask = await db.$transaction(async (prisma) => {
      // Update the task
      const task = await prisma.task.update({
        where: {
          id,
        },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(priorityId && { priorityId }),
          ...(projectId !== undefined && { projectId: projectId || null }),
          ...(status && { status }),
          ...(order !== undefined && { order }),
        },
      });

      // Handle attachments if provided
      if (attachments && Array.isArray(attachments)) {
        // Delete existing attachments
        await prisma.attachment.deleteMany({
          where: { taskId: id }
        });

        // Create new attachments
        if (attachments.length > 0) {
          await prisma.attachment.createMany({
            data: attachments.map((attachment: any) => ({
              name: attachment.name,
              originalName: attachment.originalName,
              path: attachment.path,
              taskId: id,
              size: 0, // Default size, could be passed from frontend
              mimeType: 'application/octet-stream', // Default mime type
            }))
          });
        }
      }

      // Return updated task with includes
      return await prisma.task.findUnique({
        where: { id },
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
    });

    // Send Telegram notification for task update (always send)
    if (updatedTask && telegramService.isConfigured()) {
      try {
        const telegramMessage = await telegramService.sendTaskUpdatedNotification(
          { task: updatedTask },
          existingTask.telegramMessageId || undefined
        );
        
        // Update task with new Telegram message ID if a new message was sent
        if (telegramMessage && !existingTask.telegramMessageId) {
          await db.task.update({
            where: { id: updatedTask.id },
            data: { telegramMessageId: telegramMessage.messageId }
          });
        }
      } catch (error) {
        console.error('Failed to send Telegram notification for task update:', error);
        // Don't fail the request if Telegram notification fails
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
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
    const existingTask = await db.task.findUnique({
      where: {
        id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    await db.task.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}