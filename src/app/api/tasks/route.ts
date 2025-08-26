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

    const tasks = await db.task.findMany({
      where: {
        userId: actualUserId,
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
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      dueDate,
      priorityId,
      projectId,
      userId,
      status = "TODO",
      order,
      attachments,
    } = body

    if (!title || !priorityId || !userId) {
      return NextResponse.json(
        { error: "Title, priority, and user ID are required" },
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

    // If order is not provided, get the next order for this status
    let taskOrder = order
    if (taskOrder === undefined) {
      const lastTask = await db.task.findFirst({
        where: {
          userId: actualUserId,
          status,
        },
        orderBy: { order: 'desc' },
      })
      taskOrder = lastTask ? lastTask.order + 1 : 0
    }

    // Use a transaction to create task and handle attachments
    const task = await db.$transaction(async (prisma) => {
      // Create the task
      const createdTask = await prisma.task.create({
        data: {
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          priorityId,
          projectId: projectId || null,
          userId: actualUserId,
          status,
          order: taskOrder,
        },
      })

      // Create attachments if provided
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        await prisma.attachment.createMany({
          data: attachments.map((attachment: any) => ({
            name: attachment.name,
            originalName: attachment.originalName,
            path: attachment.path,
            taskId: createdTask.id,
            size: 0, // Default size, could be passed from frontend
            mimeType: 'application/octet-stream', // Default mime type
          }))
        })
      }

      // Return created task with includes
      return await prisma.task.findUnique({
        where: { id: createdTask.id },
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
        },
      })
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}