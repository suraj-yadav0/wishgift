import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  price: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  productUrl: z.string().nullable().optional(),
  priority: z.number().int().optional(),
  quantity: z.number().int().positive().optional(),
});

// GET item and verify ownership helper
async function getItemAndVerifyOwnership(itemId: string, userId: string) {
  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: { select: { userId: true } } },
  });

  if (!item) {
    return { error: NextResponse.json({ error: 'Item not found' }, { status: 404 }), item: null };
  }

  if (item.wishlist.userId !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), item: null };
  }

  return { error: null, item };
}

// PUT /api/wishlists/items/[itemId] - Update item (only wishlist owner)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await params;

  try {
    const { error, item } = await getItemAndVerifyOwnership(itemId, userId);
    if (error) return error;

    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedItem = await db.wishlistItem.update({
      where: { id: itemId },
      data: parsed.data,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/wishlists/items/[itemId] - Delete item (only wishlist owner)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await params;

  try {
    const { error } = await getItemAndVerifyOwnership(itemId, userId);
    if (error) return error;

    await db.wishlistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
