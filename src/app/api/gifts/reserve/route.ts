import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const reserveSchema = z.object({
  wishlistItemId: z.string().min(1, 'wishlistItemId is required'),
  quantity: z.number().int().positive().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

// POST /api/gifts/reserve - Reserve a gift item
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = reserveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { wishlistItemId, quantity, message, isAnonymous } = parsed.data;

    // Verify the item exists
    const item = await db.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: {
        wishlist: { select: { userId: true } },
        reservations: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Cannot reserve your own item
    if (item.wishlist.userId === userId) {
      return NextResponse.json({ error: 'Cannot reserve your own item' }, { status: 400 });
    }

    // Check if already reserved by this user
    if (item.reservations.length > 0) {
      return NextResponse.json({ error: 'Already reserved this item' }, { status: 409 });
    }

    const reservation = await db.giftReservation.create({
      data: {
        userId,
        wishlistItemId,
        quantity: quantity ?? 1,
        message,
        isAnonymous: isAnonymous ?? false,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Error reserving gift:', error);
    return NextResponse.json({ error: 'Failed to reserve gift' }, { status: 500 });
  }
}
