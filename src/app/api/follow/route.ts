import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const followSchema = z.object({
  followingId: z.string().min(1, 'followingId is required'),
});

// POST /api/follow - Follow a user
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = followSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { followingId } = parsed.data;

    // Cannot follow self
    if (followingId === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const follow = await db.follow.create({
      data: {
        followerId: userId,
        followingId,
      },
      include: {
        following: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (already following)
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
    }
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

// DELETE /api/follow - Unfollow a user
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = followSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { followingId } = parsed.data;

    try {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId,
          },
        },
      });

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Not following this user' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}

// GET /api/follow - Get list of users that current user follows
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const following = await db.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = following.map((f) => f.following);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching following list:', error);
    return NextResponse.json({ error: 'Failed to fetch following list' }, { status: 500 });
  }
}
