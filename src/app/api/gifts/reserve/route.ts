import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/auth-utils';

const reserveSchema = z.object({
  wishlistItemId: z.string().min(1, 'wishlistItemId is required'),
  quantity: z.number().int().positive().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

// POST /api/gifts/reserve - Reserve a gift item
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
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
    const reserveQty = quantity ?? 1;

    const result = await db.$transaction(async (tx) => {
      // Verify the item exists
      const item = await tx.wishlistItem.findUnique({
        where: { id: wishlistItemId },
        include: {
          wishlist: { select: { userId: true, isPublic: true } },
          reservations: true,
        },
      });

      if (!item) {
        return { status: 404, error: 'Item not found' };
      }

      // Cannot reserve your own item
      if (item.wishlist.userId === userId) {
        return { status: 400, error: 'Cannot reserve your own item' };
      }

      // Must be public AND user must follow the wishlist owner to reserve
      if (!item.wishlist.isPublic) {
        return { status: 403, error: 'Wishlist is private' };
      }

      const isFollower = await tx.follow.findFirst({
        where: {
          followerId: userId,
          followingId: item.wishlist.userId,
          status: 'ACCEPTED',
        },
      });

      if (!isFollower) {
        return { status: 403, error: 'Wishlist is only accessible to followers' };
      }

      // Check if already reserved by this user
      const userReservation = item.reservations.find((r) => r.userId === userId);
      if (userReservation) {
        return { status: 409, error: 'Already reserved this item' };
      }

      // Check total reserved quantity vs item quantity
      const totalReserved = item.reservations.reduce((sum, r) => sum + r.quantity, 0);
      if (totalReserved + reserveQty > item.quantity) {
        return { status: 409, error: 'Item is already fully reserved' };
      }

      const reservation = await tx.giftReservation.create({
        data: {
          userId,
          wishlistItemId,
          quantity: reserveQty,
          message,
          isAnonymous: isAnonymous ?? false,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      });

      return { status: 201, data: reservation };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error reserving gift:', error);
    return NextResponse.json({ error: 'Failed to reserve gift' }, { status: 500 });
  }
}
