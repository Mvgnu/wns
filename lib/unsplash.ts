'use server';

import fs from 'fs';
import path from 'path';
import { cache } from 'react';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'd0EeF4h-pxmGEky32qBiTzZuEA3rTG7ly8AnDoH-INQ';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public/images/sports');

// Make sure the sports images directory exists
try {
  if (!fs.existsSync(IMAGE_DIRECTORY)) {
    fs.mkdirSync(IMAGE_DIRECTORY, { recursive: true });
  }
} catch (error) {
  console.error('Error creating image directory:', error);
}

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  width: number;
  height: number;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Search for images on Unsplash
 */
async function searchUnsplashImages(query: string, orientation: string = 'landscape'): Promise<UnsplashPhoto[]> {
  try {
    const params = new URLSearchParams({
      query,
      per_page: '10',
      orientation,
      content_filter: 'high',
    });

    const response = await fetch(`${UNSPLASH_BASE_URL}/search/photos?${params.toString()}`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      next: {
        // Cache for 1 day
        revalidate: 86400
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as UnsplashSearchResponse;
    return data.results;
  } catch (error) {
    console.error(`Error searching Unsplash for "${query}":`, error);
    return [];
  }
}

/**
 * Download an image from Unsplash and save it locally
 */
async function downloadUnsplashImage(photo: UnsplashPhoto, fileName: string): Promise<string> {
  const filePath = path.join(IMAGE_DIRECTORY, `${fileName}.jpg`);
  const relativePath = `/images/sports/${fileName}.jpg`;

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
    return relativePath;
  }

  try {
    const response = await fetch(photo.urls.regular);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return relativePath;
  } catch (error) {
    console.error(`Error downloading image ${fileName}:`, error);
    return '';
  }
}

/**
 * Get an image for a sport, downloading it from Unsplash if needed
 */
export const getSportImage = cache(async (sport: string): Promise<string> => {
  // Normalize sport name for file naming
  const normalizedSport = sport.toLowerCase().replace(/\s+/g, '-');
  const fileName = `sport-${normalizedSport}`;
  const filePath = path.join(IMAGE_DIRECTORY, `${fileName}.jpg`);
  const relativePath = `/images/sports/${fileName}.jpg`;

  // Return cached image if it exists
  if (fs.existsSync(filePath)) {
    return relativePath;
  }

  // Search for images on Unsplash
  const searchQuery = `${sport} sport active`;
  const photos = await searchUnsplashImages(searchQuery);

  if (photos.length === 0) {
    // Fallback to a default image if no results
    return '/images/default-sport.jpg';
  }

  // Use the first result
  const photo = photos[0];
  return await downloadUnsplashImage(photo, fileName);
});

/**
 * Get images for multiple sports at once (optimized batch operation)
 */
export const getSportImages = cache(async (sports: string[]): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  await Promise.all(sports.map(async (sport) => {
    results[sport] = await getSportImage(sport);
  }));
  
  return results;
}); 