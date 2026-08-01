import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/users?q=searchTerm - Search users by name or username
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const users = await db.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name: { contains: q } },
          { username: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        _count: {
          select: {
            followers: { where: { status: 'ACCEPTED' } },
          },
        },
        followers: {
          where: { followerId: userId },
          select: { id: true, status: true },
        },
      },
      take: 20,
    });

    const results = users.map((user) => {
      const followRecord = user.followers[0];
      const followStatus = followRecord ? followRecord.status : 'NONE';
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        followerCount: user._count.followers,
        followStatus,
        isFollowingByCurrentUser: followStatus === 'ACCEPTED',
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
