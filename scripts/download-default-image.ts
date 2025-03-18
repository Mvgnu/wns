/**
 * Script to download the default sport image
 * Run with: npx ts-node scripts/download-default-image.ts
 */

import fs from 'fs';
import path from 'path';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'd0EeF4h-pxmGEky32qBiTzZuEA3rTG7ly8AnDoH-INQ';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const DEFAULT_IMAGE_PATH = path.join(process.cwd(), 'public/images/default-sport.jpg');

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
}

/**
 * Search for a generic sports image on Unsplash
 */
async function searchUnsplashImages(): Promise<UnsplashPhoto[]> {
  try {
    // Simple query for a generic sports image
    const params = new URLSearchParams({
      query: 'sports',
      per_page: '5',
      orientation: 'landscape',
      content_filter: 'high',
    });

    const response = await fetch(`${UNSPLASH_BASE_URL}/search/photos?${params.toString()}`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { results: UnsplashPhoto[] };
    return data.results;
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return [];
  }
}

/**
 * Download the default sport image
 */
async function downloadDefaultImage() {
  if (fs.existsSync(DEFAULT_IMAGE_PATH)) {
    console.log('Default sport image already exists:', DEFAULT_IMAGE_PATH);
    console.log('Deleting existing default image to replace it...');
    fs.unlinkSync(DEFAULT_IMAGE_PATH);
  }

  try {
    // Search for a generic sports image
    console.log('Searching for a generic sports image...');
    const photos = await searchUnsplashImages();
    
    if (photos.length === 0) {
      console.error('Could not find any images on Unsplash');
      return;
    }

    // Download the image
    console.log('Downloading default sport image...');
    const response = await fetch(photos[0].urls.regular);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(DEFAULT_IMAGE_PATH, buffer);
    console.log('✅ Successfully downloaded default sport image to:', DEFAULT_IMAGE_PATH);
  } catch (error) {
    console.error('Error downloading default image:', error);
  }
}

// Execute the function
downloadDefaultImage().catch(error => {
  console.error('Error in script execution:', error);
  process.exit(1);
}); 