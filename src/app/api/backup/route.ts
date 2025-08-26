import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all data from the database
    const [users, projects, priorities, tasks, comments, attachments] = await Promise.all([
      prisma.user.findMany(),
      prisma.project.findMany(),
      prisma.priority.findMany(),
      prisma.task.findMany({
        include: {
          project: true,
          priority: true,
          comments: {
            include: {
              user: true
            }
          },
          attachments: true
        }
      }),
      prisma.comment.findMany({
        include: {
          user: true,
          task: true
        }
      }),
      prisma.attachment.findMany({
        include: {
          task: true
        }
      })
    ])

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users,
        projects,
        priorities,
        tasks,
        comments,
        attachments
      }
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="taskpro-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
