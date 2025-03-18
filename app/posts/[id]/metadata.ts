import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { createPostSchema, createUGCSchema, combineSchemas } from '@/lib/schema';

// Generate metadata for post detail pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Get post data
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!post) {
    return {
      title: 'Beitrag nicht gefunden',
      description: 'Der angeforderte Beitrag wurde nicht gefunden',
    };
  }

  // Base URL for schemas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wns-community.com';
  
  // Create schema.org schemas
  const postSchema = createPostSchema(post, baseUrl);
  
  // Add UGC schema for user-generated content
  const ugcSchema = createUGCSchema({
    type: 'Post',
    url: `${baseUrl}/posts/${post.id}`,
    creator: post.author ? {
      name: post.author.name || 'Unbekannt',
      url: `${baseUrl}/profile/${post.author.id}`,
    } : undefined,
    dateCreated: post.createdAt,
    dateModified: post.updatedAt,
  });
  
  // Combine schemas
  const schema = combineSchemas(postSchema, ugcSchema);

  // Create a text-only version of the content for description
  let textContent = post.content || '';
  
  // Remove HTML tags for description text
  textContent = textContent.replace(/<[^>]*>?/gm, '');
  
  // Format the description
  let description = post.title;
  if (textContent) {
    description += `: ${textContent.substring(0, 150)}${textContent.length > 150 ? '...' : ''}`;
  }
  if (post.group?.name) {
    description += ` • ${post.group.name}`;
  }

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `${baseUrl}/posts/${post.id}`,
      images: [
        {
          url: post.images?.[0] || `/api/og?title=${encodeURIComponent(post.title)}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [post.images?.[0] || `/api/og?title=${encodeURIComponent(post.title)}`],
    },
    alternates: {
      canonical: `${baseUrl}/posts/${post.id}`,
    },
    other: {
      'og:locale': 'de_DE',
      'og:site_name': 'WNS Community',
      'article:published_time': post.createdAt.toISOString(),
      'article:modified_time': post.updatedAt.toISOString(),
      ...(post.author?.name && { 'article:author': post.author.name }),
    },
    // Include JSON-LD schema.org markup
    ...(schema && { 
      other: {
        ...schema && { 'script:ld+json': JSON.stringify(schema) }
      }
    }),
  };
} 