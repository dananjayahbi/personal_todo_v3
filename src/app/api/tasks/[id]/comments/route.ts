import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { telegramService } from '@/lib/telegram/telegramService';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const comments = await prisma.comment.findMany({
      where: { taskId },
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
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const { content, userEmail } = await request.json();

    if (!content || !userEmail) {
      return NextResponse.json(
        { error: 'Content and user email are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userEmail.split('@')[0],
        }
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Get the updated task with all comments for Telegram notification
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    // Send Telegram notification for task update (comment added)
    if (task && telegramService.isConfigured()) {
      try {
        await telegramService.sendTaskUpdatedNotification(
          { task },
          task.telegramMessageId || undefined
        );
      } catch (error) {
        console.error('Failed to send Telegram notification for comment creation:', error);
        // Don't fail the request if Telegram notification fails
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
