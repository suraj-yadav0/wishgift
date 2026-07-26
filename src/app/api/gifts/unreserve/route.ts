import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const unreserveSchema = z.object({
  wishlistItemId: z.string().min(1, 'wishlistItemId is required'),
});

// POST /api/gifts/unreserve - Unreserve a gift
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = unreserveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { wishlistItemId } = parsed.data;

    const reservation = await db.giftReservation.findUnique({
      where: {
        userId_wishlistItemId: {
          userId,
          wishlistItemId,
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    await db.giftReservation.delete({
      where: { id: reservation.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unreserving gift:', error);
    return NextResponse.json({ error: 'Failed to unreserve gift' }, { status: 500 });
  }
}
