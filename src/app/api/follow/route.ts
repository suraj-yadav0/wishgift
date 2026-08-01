import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const followSchema = z.object({
  followingId: z.string().min(1, 'followingId is required'),
});

// POST /api/follow - Send follow request (creates record with status PENDING)
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

    // Verify follower user (current user) exists in DB
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User session invalid. Please log in again.' }, { status: 401 });
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
        status: 'PENDING',
      },
      include: {
        following: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      // Handle unique constraint violation (already requested or following)
      if (code === 'P2002') {
        return NextResponse.json({ error: 'Follow request already sent or active' }, { status: 409 });
      }
      // Handle foreign key constraint violation
      if (code === 'P2003') {
        return NextResponse.json({ error: 'Invalid user account. Please log in again.' }, { status: 400 });
      }
    }
    console.error('Error sending follow request:', error);
    return NextResponse.json({ error: 'Failed to send follow request' }, { status: 500 });
  }
}

// DELETE /api/follow - Unfollow or cancel follow request
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
      return NextResponse.json({ error: 'No follow relationship or request found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error removing follow request:', error);
    return NextResponse.json({ error: 'Failed to remove follow request' }, { status: 500 });
  }
}

// GET /api/follow - Get list of users that current user is actively following (ACCEPTED)
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const following = await db.follow.findMany({
      where: {
        followerId: userId,
        status: 'ACCEPTED',
      },
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
