import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const respondRequestSchema = z.object({
  requesterId: z.string().min(1, 'requesterId is required'),
  action: z.enum(['accept', 'reject']),
});

// GET /api/follow/requests - Get incoming pending follow requests for authenticated user
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requests = await db.follow.findMany({
      where: {
        followingId: userId,
        status: 'PENDING',
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      requester: r.follower,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    return NextResponse.json({ error: 'Failed to fetch follow requests' }, { status: 500 });
  }
}

// POST /api/follow/requests - Accept or Reject an incoming follow request
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = respondRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { requesterId, action } = parsed.data;

    // Check if pending request exists
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 });
    }

    if (action === 'accept') {
      const updated = await db.follow.update({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: userId,
          },
        },
        data: {
          status: 'ACCEPTED',
        },
        include: {
          follower: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      });

      return NextResponse.json({ success: true, action: 'accepted', follow: updated });
    } else {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: userId,
          },
        },
      });

      return NextResponse.json({ success: true, action: 'rejected' });
    }
  } catch (error) {
    console.error('Error responding to follow request:', error);
    return NextResponse.json({ error: 'Failed to respond to follow request' }, { status: 500 });
  }
}
