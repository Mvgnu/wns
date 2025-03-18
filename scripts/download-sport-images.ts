/**
 * Script to download all sport images once from Unsplash
 * Run with: npx ts-node scripts/download-sport-images.ts
 */

import fs from 'fs';
import path from 'path';
import { allSports } from '../lib/sportsData';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'd0EeF4h-pxmGEky32qBiTzZuEA3rTG7ly8AnDoH-INQ';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public/images/sports');
const DEFAULT_IMAGE_PATH = path.join(process.cwd(), 'public/images/default-sport.jpg');

// Make sure the sports images directory exists
try {
  if (!fs.existsSync(IMAGE_DIRECTORY)) {
    fs.mkdirSync(IMAGE_DIRECTORY, { recursive: true });
  }
} catch (error) {
  console.error('Error creating image directory:', error);
  process.exit(1);
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

/**
 * Search for images on Unsplash
 */
async function searchUnsplashImages(sportName: string): Promise<UnsplashPhoto[]> {
  try {
    // Use just the sport name for better results
    const query = sportName;
    
    const params = new URLSearchParams({
      query,
      per_page: '5', // Get multiple options to choose from
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
    console.error(`Error searching Unsplash for "${sportName}":`, error);
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
    console.log(`Image already exists: ${fileName}`);
    return relativePath;
  }

  try {
    console.log(`Downloading image for ${fileName}...`);
    const response = await fetch(photo.urls.regular);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Downloaded: ${fileName}`);
    return relativePath;
  } catch (error) {
    console.error(`Error downloading image ${fileName}:`, error);
    return '';
  }
}

/**
 * Create a default sport image
 */
async function createDefaultSportImage() {
  if (fs.existsSync(DEFAULT_IMAGE_PATH)) {
    console.log('Default sport image already exists');
    return;
  }

  try {
    // Search for a generic sports image
    const photos = await searchUnsplashImages('sports activity');
    if (photos.length === 0) {
      console.error('Could not find a default sports image');
      return;
    }

    console.log('Downloading default sport image...');
    const response = await fetch(photos[0].urls.regular);
    if (!response.ok) {
      throw new Error(`Failed to download default image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(DEFAULT_IMAGE_PATH, buffer);
    console.log('✅ Downloaded default sport image');
  } catch (error) {
    console.error('Error creating default sport image:', error);
  }
}

/**
 * Process all sports and download their images
 */
async function downloadAllSportImages() {
  console.log('Starting to download all sport images...');
  
  // First create the default image
  await createDefaultSportImage();
  
  // Create a map to track existing images
  const existingImages = new Map<string, boolean>();
  fs.readdirSync(IMAGE_DIRECTORY).forEach(file => {
    if (file.startsWith('sport-') && file.endsWith('.jpg')) {
      const sportValue = file.replace('sport-', '').replace('.jpg', '');
      existingImages.set(sportValue, true);
    }
  });
  
  // Process each sport
  for (const sport of allSports) {
    try {
      const normalizedSport = sport.value.toLowerCase().replace(/\s+/g, '-');
      const fileName = `sport-${normalizedSport}`;
      
      // Skip if image already exists
      if (existingImages.has(normalizedSport)) {
        console.log(`Skipping ${sport.label}, image already exists`);
        continue;
      }
      
      // Search Unsplash using JUST the sport name
      console.log(`Searching for ${sport.label}...`);
      const photos = await searchUnsplashImages(sport.label);
      
      if (photos.length === 0) {
        console.warn(`⚠️ No images found for ${sport.label}`);
        continue;
      }
      
      // Download the image
      await downloadUnsplashImage(photos[0], fileName);
      
      // Respect Unsplash API rate limits (50 requests per hour)
      console.log('Waiting to respect API rate limits...');
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      console.error(`Error processing ${sport.label}:`, error);
    }
  }
  
  console.log('Finished downloading all sport images');
}

// Execute the main function
downloadAllSportImages().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
}); 