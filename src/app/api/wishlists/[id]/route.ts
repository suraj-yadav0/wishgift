import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateWishlistSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().optional(),
  occasion: z.string().optional(),
});

// GET /api/wishlists/[id] - Get single wishlist with items
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const wishlist = await db.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        items: {
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
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    // Check access: owner can always see, others only if public
    if (!wishlist.isPublic && wishlist.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Transform items to include reservedByCurrentUser boolean
    const itemsWithReservation = wishlist.items.map((item) => ({
      ...item,
      reservationCount: item._count.reservations,
      reservedByCurrentUser: item.reservations.length > 0,
      reservations: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      ...wishlist,
      items: itemsWithReservation,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// PUT /api/wishlists/[id] - Update wishlist (only owner)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await db.wishlist.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateWishlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const wishlist = await db.wishlist.update({
      where: { id },
      data: parsed.data,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}

// DELETE /api/wishlists/[id] - Delete wishlist (only owner, cascades)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await db.wishlist.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.wishlist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json({ error: 'Failed to delete wishlist' }, { status: 500 });
  }
}
