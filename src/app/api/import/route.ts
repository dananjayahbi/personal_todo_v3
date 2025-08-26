import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileContent = await file.text()
    const backup = JSON.parse(fileContent)

    if (!backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      )
    }

    let importedCount = 0

    // Import projects first (if they don't exist)
    if (backup.data.projects) {
      for (const project of backup.data.projects) {
        const existing = await prisma.project.findUnique({
          where: { id: project.id }
        })
        
        if (!existing) {
          await prisma.project.create({
            data: {
              id: project.id,
              name: project.name,
              description: project.description,
              color: project.color,
              userId: project.userId,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt
            }
          })
        }
      }
    }

    // Import priorities (if they don't exist)
    if (backup.data.priorities) {
      for (const priority of backup.data.priorities) {
        const existing = await prisma.priority.findUnique({
          where: { id: priority.id }
        })
        
        if (!existing) {
          await prisma.priority.create({
            data: {
              id: priority.id,
              name: priority.name,
              level: priority.level,
              color: priority.color,
              createdAt: priority.createdAt,
              updatedAt: priority.updatedAt
            }
          })
        }
      }
    }

    // Import users (if they don't exist)
    if (backup.data.users) {
      for (const user of backup.data.users) {
        const existing = await prisma.user.findUnique({
          where: { id: user.id }
        })
        
        if (!existing) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          })
        }
      }
    }

    // Import tasks (only if they don't exist)
    if (backup.data.tasks) {
      for (const task of backup.data.tasks) {
        const existing = await prisma.task.findUnique({
          where: { id: task.id }
        })
        
        if (!existing) {
          await prisma.task.create({
            data: {
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              status: task.status,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              order: task.order,
              userId: task.userId,
              projectId: task.projectId,
              priorityId: task.priorityId
            }
          })
          importedCount++
        }
      }
    }

    // Import comments (only if they don't exist)
    if (backup.data.comments) {
      for (const comment of backup.data.comments) {
        const existing = await prisma.comment.findUnique({
          where: { id: comment.id }
        })
        
        if (!existing) {
          await prisma.comment.create({
            data: {
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              taskId: comment.taskId,
              userId: comment.userId
            }
          })
        }
      }
    }

    // Import attachments (only if they don't exist)
    if (backup.data.attachments) {
      for (const attachment of backup.data.attachments) {
        const existing = await prisma.attachment.findUnique({
          where: { id: attachment.id }
        })
        
        if (!existing) {
          await prisma.attachment.create({
            data: {
              id: attachment.id,
              name: attachment.name,
              originalName: attachment.originalName,
              path: attachment.path,
              size: attachment.size,
              mimeType: attachment.mimeType || attachment.type,
              createdAt: attachment.createdAt,
              taskId: attachment.taskId
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      count: importedCount,
      message: `Successfully imported ${importedCount} new tasks` 
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import tasks: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
