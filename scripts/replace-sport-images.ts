/**
 * Script to replace all sport images with better matching ones
 * Run with: npx ts-node scripts/replace-sport-images.ts
 */

import fs from 'fs';
import path from 'path';
import { allSports } from '../lib/sportsData';

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
 * Search for images on Unsplash with just the sport name for better results
 */
async function searchUnsplashImages(sportName: string): Promise<UnsplashPhoto[]> {
  try {
    // Use just the sport name for more accurate results
    const query = sportName;
    
    const params = new URLSearchParams({
      query,
      per_page: '5', // Get a few options to choose from
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
 * Download an image from Unsplash and save it locally, overwriting existing ones
 */
async function downloadUnsplashImage(photo: UnsplashPhoto, fileName: string): Promise<string> {
  const filePath = path.join(IMAGE_DIRECTORY, `${fileName}.jpg`);
  const relativePath = `/images/sports/${fileName}.jpg`;

  try {
    console.log(`Downloading new image for ${fileName}...`);
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
 * Process all sports and replace their images
 */
async function replaceAllSportImages() {
  console.log('Starting to replace all sport images with better matches...');
  
  // Process each sport
  for (const sport of allSports) {
    try {
      const normalizedSport = sport.value.toLowerCase().replace(/\s+/g, '-');
      const fileName = `sport-${normalizedSport}`;
      
      // Search Unsplash using JUST the sport name for more accurate results
      console.log(`Finding better image for ${sport.label}...`);
      const photos = await searchUnsplashImages(sport.label);
      
      if (photos.length === 0) {
        console.warn(`⚠️ No images found for ${sport.label}`);
        continue;
      }
      
      // Download and replace the image
      await downloadUnsplashImage(photos[0], fileName);
      
      // Respect Unsplash API rate limits (50 requests per hour)
      console.log('Waiting to respect API rate limits...');
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (error) {
      console.error(`Error processing ${sport.label}:`, error);
    }
  }
  
  console.log('✅ Finished replacing all sport images');
}

// Execute the main function
replaceAllSportImages().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
}); 