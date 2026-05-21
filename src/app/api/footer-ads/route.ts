import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch footer ads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      const now = new Date();

      const footerAds = await db.footerAd.findMany({
        where: {
          isActive: true,
          OR: [
            // Both startDate and endDate are set
            {
              startDate: { lte: now },
              endDate: { gte: now },
            },
            // Only startDate is set, endDate is null
            {
              startDate: { lte: now },
              endDate: null,
            },
            // Only endDate is set, startDate is null
            {
              startDate: null,
              endDate: { gte: now },
            },
            // Both startDate and endDate are null (always valid)
            {
              startDate: null,
              endDate: null,
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ footerAds }, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
      });
    }

    // Default: fetch all footer ads (for admin panel)
    const footerAds = await db.footerAd.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ footerAds }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
    });
  } catch (error) {
    console.error('Error fetching footer ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch footer ads' },
      { status: 500 }
    );
  }
}

// POST - Create a footer ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      mediaUrl,
      thumbnailUrl,
      adType,
      mediaFormat,
      isActive,
      linkUrl,
      startDate,
      endDate,
    } = body;

    if (!title || !mediaUrl) {
      return NextResponse.json(
        { error: 'Title and mediaUrl are required' },
        { status: 400 }
      );
    }

    const footerAd = await db.footerAd.create({
      data: {
        title,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || null,
        adType: adType || 'image',
        mediaFormat: mediaFormat || 'jpg',
        isActive: isActive !== undefined ? isActive : true,
        linkUrl: linkUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ footerAd }, { status: 201 });
  } catch (error) {
    console.error('Error creating footer ad:', error);
    return NextResponse.json(
      { error: 'Failed to create footer ad' },
      { status: 500 }
    );
  }
}

// PUT - Update a footer ad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, incrementImpressions, incrementClicks, ...fieldsToUpdate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if the footer ad exists
    const existing = await db.footerAd.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Footer ad not found' },
        { status: 404 }
      );
    }

    // Build update data from provided fields
    const data: Record<string, unknown> = {};

    if (fieldsToUpdate.title !== undefined) data.title = fieldsToUpdate.title;
    if (fieldsToUpdate.mediaUrl !== undefined) data.mediaUrl = fieldsToUpdate.mediaUrl;
    if (fieldsToUpdate.thumbnailUrl !== undefined) data.thumbnailUrl = fieldsToUpdate.thumbnailUrl || null;
    if (fieldsToUpdate.adType !== undefined) data.adType = fieldsToUpdate.adType;
    if (fieldsToUpdate.mediaFormat !== undefined) data.mediaFormat = fieldsToUpdate.mediaFormat;
    if (fieldsToUpdate.isActive !== undefined) data.isActive = fieldsToUpdate.isActive;
    if (fieldsToUpdate.linkUrl !== undefined) data.linkUrl = fieldsToUpdate.linkUrl || null;
    if (fieldsToUpdate.startDate !== undefined) data.startDate = fieldsToUpdate.startDate ? new Date(fieldsToUpdate.startDate) : null;
    if (fieldsToUpdate.endDate !== undefined) data.endDate = fieldsToUpdate.endDate ? new Date(fieldsToUpdate.endDate) : null;

    // Handle impression increment
    if (incrementImpressions) {
      data.impressions = existing.impressions + 1;
    }

    // Handle click increment with CTR recalculation
    if (incrementClicks) {
      const newClicks = existing.clicks + 1;
      const newImpressions = (data.impressions as number) ?? existing.impressions;
      data.clicks = newClicks;
      data.ctr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0;
    }

    const footerAd = await db.footerAd.update({
      where: { id },
      data,
    });

    return NextResponse.json({ footerAd });
  } catch (error) {
    console.error('Error updating footer ad:', error);
    return NextResponse.json(
      { error: 'Failed to update footer ad' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a footer ad
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.footerAd.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Footer ad not found' },
        { status: 404 }
      );
    }

    await db.footerAd.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting footer ad:', error);
    return NextResponse.json(
      { error: 'Failed to delete footer ad' },
      { status: 500 }
    );
  }
}
