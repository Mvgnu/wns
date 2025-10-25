import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { createGroupSchema, createUGCSchema, combineSchemas } from '@/lib/schema';

// Generate metadata for group detail pages
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // First try to find by slug, then by ID for backward compatibility
  let group = await prisma.group.findUnique({
    where: { slug: params.slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
          events: true,
        },
      },
    },
  });

  // If not found by slug, try by ID
  if (!group) {
    group = await prisma.group.findUnique({
      where: { id: params.slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          },
        },
      },
    });
  }

  if (!group) {
    return {
      title: 'Gruppe nicht gefunden',
      description: 'Die angeforderte Gruppe wurde nicht gefunden',
    };
  }

  // Base URL for schemas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  
  // Create schema.org schemas
  const groupSchema = createGroupSchema(group, baseUrl);
  
  // Add UGC schema for user-generated content
  const ugcSchema = createUGCSchema({
    type: 'Group',
    url: `${baseUrl}/groups/${group.slug || group.id}`,
    creator: group.owner ? {
      name: group.owner.name || 'Unbekannt',
      url: `${baseUrl}/profile/${group.owner.id}`,
    } : undefined,
    dateCreated: group.createdAt,
    dateModified: group.updatedAt,
  });
  
  // Combine schemas
  const schema = combineSchemas(groupSchema, ugcSchema);

  // Create description
  let description = `${group.name} - Eine ${group.sport} Gruppe`;
  if (group.description) {
    description += `: ${group.description.substring(0, 150)}${group.description.length > 150 ? '...' : ''}`;
  }
  if (group._count) {
    description += ` • ${group._count.members} Mitglieder`;
  }

  return {
    title: `${group.name} | ${group.sport}`,
    description,
    openGraph: {
      title: `${group.name} | ${group.sport}`,
      description,
      type: 'article',
      url: `${baseUrl}/groups/${group.slug || group.id}`,
      images: [
        {
          url: group.image || `/api/og?title=${encodeURIComponent(group.name)}&subtitle=${encodeURIComponent(group.sport)}`,
          width: 1200,
          height: 630,
          alt: group.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${group.name} | ${group.sport}`,
      description,
      images: [group.image || `/api/og?title=${encodeURIComponent(group.name)}&subtitle=${encodeURIComponent(group.sport)}`],
    },
    alternates: {
      canonical: `${baseUrl}/groups/${group.slug || group.id}`,
    },
    other: {
      'og:locale': 'de_DE',
      'og:site_name': 'WNS Community',
    },
    // Include JSON-LD schema.org markup
    ...(schema && { 
      other: {
        ...schema && { 'script:ld+json': JSON.stringify(schema) }
      }
    }),
  };
} 