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

    // Clear existing data (in order to avoid foreign key constraints)
    await prisma.attachment.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.priority.deleteMany()
    await prisma.user.deleteMany()

    // Restore data in the correct order
    if (backup.data.users) {
      await prisma.user.createMany({
        data: backup.data.users
      })
    }

    if (backup.data.priorities) {
      await prisma.priority.createMany({
        data: backup.data.priorities
      })
    }

    if (backup.data.projects) {
      const projectsData = backup.data.projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        userId: project.userId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }))
      
      await prisma.project.createMany({
        data: projectsData
      })
    }

    if (backup.data.tasks) {
      // Create tasks without relationships first
      const tasksData = backup.data.tasks.map((task: any) => ({
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
      }))
      
      await prisma.task.createMany({
        data: tasksData
      })
    }

    if (backup.data.comments) {
      const commentsData = backup.data.comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        taskId: comment.taskId,
        userId: comment.userId
      }))
      
      await prisma.comment.createMany({
        data: commentsData
      })
    }

    if (backup.data.attachments) {
      const attachmentsData = backup.data.attachments.map((attachment: any) => ({
        id: attachment.id,
        name: attachment.name,
        originalName: attachment.originalName,
        path: attachment.path,
        size: attachment.size,
        mimeType: attachment.mimeType || attachment.type,
        createdAt: attachment.createdAt,
        taskId: attachment.taskId
      }))
      
      await prisma.attachment.createMany({
        data: attachmentsData
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database restored successfully' 
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore database: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
