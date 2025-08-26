import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
