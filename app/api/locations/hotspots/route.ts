import { NextRequest, NextResponse } from 'next/server';

import { aggregateHotspots, summariseHotspot } from '@/lib/geo/hotspots';
import { withinRadius } from '@/lib/geo/proximity';
import { prisma } from '@/lib/prisma';

// route: locations-hotspots
const DEFAULT_LIMIT = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10), 50);
  const cellSizeMeters = parseInt(searchParams.get('cell') ?? '2500', 10);
  const radiusMeters = parseInt(searchParams.get('radius') ?? '1500', 10);

  const [locations, upcomingEvents] = await Promise.all([
    prisma.location.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        sports: true,
        sport: true,
        city: true,
        state: true,
        country: true,
        image: true,
        _count: { select: { events: true } },
      },
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    }),
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        startTime: true,
        location: {
          select: {
            latitude: true,
            longitude: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      where: {
        startTime: {
          gte: new Date(),
        },
        location: {
          isNot: null,
        },
      },
      take: 250,
      orderBy: { startTime: 'asc' },
    }),
  ]);

  const hotspots = aggregateHotspots(locations, {
    cellSizeMeters,
    radiusMeters,
    sourceToPayload: source => ({
      id: source.id,
      name: source.name,
      slug: source.slug ?? source.id,
      latitude: source.latitude,
      longitude: source.longitude,
      sport: source.sport || source.sports[0],
      sports: source.sports,
      city: source.city,
      state: source.state,
      country: source.country,
      image: source.image,
      eventCount: source._count.events,
    }),
    weightBy: source => 1 + source._count.events * 0.5,
  });

  const topHotspots = hotspots.slice(0, limit).map(hotspot => {
    const summary = summariseHotspot(hotspot);
    const venues = hotspot.payloads
      .slice(0, 6)
      .map(payload => ({
        id: payload.id,
        name: payload.name,
        slug: payload.slug,
        sport: payload.sport,
        sports: payload.sports,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        image: payload.image,
        eventCount: payload.eventCount,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }));

    const nearbyEvents = withinRadius(
      summary.center,
      upcomingEvents
        .filter(event => !!event.location)
        .map(event => ({
          latitude: event.location!.latitude,
          longitude: event.location!.longitude,
          event,
        })),
      summary.radiusMeters
    )
      .slice(0, 5)
      .map(match => ({
        id: match.item.event.id,
        title: match.item.event.title,
        slug: match.item.event.slug,
        startTime: match.item.event.startTime,
        group: match.item.event.group,
        distanceMeters: match.distanceMeters,
        locationName: match.item.event.location?.name,
      }));

    return {
      ...summary,
      venues,
      nearbyEvents,
    };
  });

  return NextResponse.json({ hotspots: topHotspots });
}
