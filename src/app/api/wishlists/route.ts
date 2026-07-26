import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createWishlistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().optional(),
  occasion: z.string().optional(),
});

// GET /api/wishlists - Get all wishlists for authenticated user (or another user's public wishlists)
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');

  try {
    // If userId query param is provided, return that user's public wishlists
    if (targetUserId) {
      const wishlists = await db.wishlist.findMany({
        where: {
          userId: targetUserId,
          isPublic: true,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json(wishlists);
    }

    // Return current user's wishlists (all, including private)
    const wishlists = await db.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(wishlists);
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlists' }, { status: 500 });
  }
}

// POST /api/wishlists - Create a new wishlist
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createWishlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const wishlist = await db.wishlist.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description,
        coverImage: parsed.data.coverImage,
        isPublic: parsed.data.isPublic ?? true,
        occasion: parsed.data.occasion,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json({ error: 'Failed to create wishlist' }, { status: 500 });
  }
}
