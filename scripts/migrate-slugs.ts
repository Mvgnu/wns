#!/usr/bin/env ts-node

/**
 * Migration script to add slug fields to Location, Event, and Post models
 * and generate slugs for existing data
 */

import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function generateSlug(baseName: string, existingSlugs: string[] = []): Promise<string> {
  let slug = slugify(baseName, {
    lower: true,
    strict: true,
    locale: 'de',
  });

  // Handle duplicates
  let counter = 1;
  let uniqueSlug = slug;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

async function migrateLocations() {
  console.log('📍 Migrating Location slugs...');

  try {
    // Get all locations
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`Found ${locations.length} locations to migrate`);

    // Get existing slugs to avoid duplicates
    const existingSlugs = locations
      .filter(l => l.slug)
      .map(l => l.slug!);

    let updated = 0;

    for (const location of locations) {
      if (!location.slug) {
        const slug = await generateSlug(location.name, existingSlugs);
        existingSlugs.push(slug);

        await prisma.location.update({
          where: { id: location.id },
          data: { slug },
        });

        updated++;
      }
    }

    console.log(`✅ Updated ${updated} locations with slugs`);
  } catch (error) {
    console.error('❌ Error migrating locations:', error);
  }
}

async function migrateEvents() {
  console.log('📅 Migrating Event slugs...');

  try {
    // Get all events
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`Found ${events.length} events to migrate`);

    // Get existing slugs to avoid duplicates
    const existingSlugs = events
      .filter(e => e.slug)
      .map(e => e.slug!);

    let updated = 0;

    for (const event of events) {
      if (!event.slug) {
        const slug = await generateSlug(event.title, existingSlugs);
        existingSlugs.push(slug);

        await prisma.event.update({
          where: { id: event.id },
          data: { slug },
        });

        updated++;
      }
    }

    console.log(`✅ Updated ${updated} events with slugs`);
  } catch (error) {
    console.error('❌ Error migrating events:', error);
  }
}

async function migratePosts() {
  console.log('📝 Migrating Post slugs...');

  try {
    // Get all posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`Found ${posts.length} posts to migrate`);

    // Get existing slugs to avoid duplicates
    const existingSlugs = posts
      .filter(p => p.slug)
      .map(p => p.slug!);

    let updated = 0;

    for (const post of posts) {
      if (!post.slug) {
        const slug = await generateSlug(post.title, existingSlugs);
        existingSlugs.push(slug);

        await prisma.post.update({
          where: { id: post.id },
          data: { slug },
        });

        updated++;
      }
    }

    console.log(`✅ Updated ${updated} posts with slugs`);
  } catch (error) {
    console.error('❌ Error migrating posts:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting slug migration...\n');

    await migrateLocations();
    await migrateEvents();
    await migratePosts();

    console.log('\n🎉 Slug migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main().catch(console.error);

