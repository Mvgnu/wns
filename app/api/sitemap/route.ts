import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';

  try {
    // Fetch all public content for sitemap
    const [groups, locations, events, posts] = await Promise.all([
      // Get public groups
      prisma.group.findMany({
        where: {
          status: 'active',
          isPrivate: false,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),

      // Get public locations
      prisma.location.findMany({
        where: {
          verified: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1000, // Limit for performance
      }),

      // Get public events
      prisma.event.findMany({
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1000, // Limit for performance
      }),

      // Get public posts
      prisma.post.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1000, // Limit for performance
      }),
    ]);

    // Build sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${groups.map(group => `
  <url>
    <loc>${baseUrl}/groups/${group.slug}</loc>
    <lastmod>${group.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  ${locations.map(location => `
  <url>
    <loc>${baseUrl}/locations/${location.slug}</loc>
    <lastmod>${location.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  ${events.map(event => `
  <url>
    <loc>${baseUrl}/events/${event.slug}</loc>
    <lastmod>${event.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
