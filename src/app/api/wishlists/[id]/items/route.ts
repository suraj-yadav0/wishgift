import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  price: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  productUrl: z.string().nullable().optional(),
  priority: z.number().int().optional(),
  quantity: z.number().int().positive().optional(),
  isPurchased: z.boolean().optional(),
});

// GET /api/wishlists/[id]/items - Get all items for a wishlist
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const wishlist = await db.wishlist.findUnique({
      where: { id },
      select: { userId: true, isPublic: true },
    });

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    // Check access: owner can always see; others only if public AND following the owner
    if (wishlist.userId !== userId) {
      if (!wishlist.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const isFollower = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: wishlist.userId,
          },
        },
      });

      if (!isFollower) {
        return NextResponse.json({ error: 'Wishlist is only visible to followers' }, { status: 403 });
      }
    }

    const items = await db.wishlistItem.findMany({
      where: { wishlistId: id },
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { priority: 'desc' },
    });

    const itemsWithReservation = items.map((item) => ({
      ...item,
      reservationCount: item._count.reservations,
      reservedByCurrentUser: item.reservations.length > 0,
      reservations: undefined,
      _count: undefined,
    }));

    return NextResponse.json(itemsWithReservation);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/wishlists/[id]/items - Add item to wishlist (only owner)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const wishlist = await db.wishlist.findUnique({ where: { id } });

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    if (wishlist.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const item = await db.wishlistItem.create({
      data: {
        wishlistId: id,
        title: parsed.data.title,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        price: parsed.data.price,
        currency: parsed.data.currency ?? 'USD',
        productUrl: parsed.data.productUrl,
        priority: parsed.data.priority ?? 0,
        quantity: parsed.data.quantity ?? 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
