/**
 * Script to replace images for additional sports
 * Run with: npx ts-node scripts/replace-more-images.ts
 */

import fs from 'fs';
import path from 'path';

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'd0EeF4h-pxmGEky32qBiTzZuEA3rTG7ly8AnDoH-INQ';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const IMAGE_DIRECTORY = path.join(process.cwd(), 'public/images/sports');

// Define specific sports to update with custom search terms
const SPORTS_WITH_TERMS = [
  { value: 'martial_arts', label: 'Kampfsport', searchTerm: 'martial arts' },
  { value: 'rock_climbing', label: 'Klettern', searchTerm: 'rock climbing' },
  { value: 'inline_skating', label: 'Inline Skating', searchTerm: 'inline skating' },
  { value: 'surfing', label: 'Surfen', searchTerm: 'surfing wave' },
  { value: 'rugby', label: 'Rugby', searchTerm: 'rugby game' },
  { value: 'skating', label: 'Skateboarding', searchTerm: 'skateboarding' },
  { value: 'badminton', label: 'Badminton', searchTerm: 'badminton game' },
  { value: 'ultimate_frisbee', label: 'Ultimate Frisbee', searchTerm: 'ultimate frisbee' },
  { value: 'crossfit', label: 'CrossFit', searchTerm: 'crossfit workout' },
  { value: 'street_hockey', label: 'Street Hockey', searchTerm: 'street hockey' },
  { value: 'archery', label: 'Bogenschießen', searchTerm: 'archery' },
  { value: 'fishing', label: 'Angeln', searchTerm: 'fishing' },
  { value: 'other', label: 'Sonstiges', searchTerm: 'sports diverse' },
];

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
 * Search for images on Unsplash with custom search terms
 */
async function searchUnsplashImages(searchTerm: string): Promise<UnsplashPhoto[]> {
  try {
    const params = new URLSearchParams({
      query: searchTerm,
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
    console.error(`Error searching Unsplash for "${searchTerm}":`, error);
    return [];
  }
}

/**
 * Download an image from Unsplash and save it locally
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
 * Process sports with custom search terms
 */
async function replaceMoreImages() {
  console.log('Starting to replace images for additional sports...');
  
  // Process each sport
  for (const sport of SPORTS_WITH_TERMS) {
    try {
      const normalizedSport = sport.value.toLowerCase().replace(/\s+/g, '-');
      const fileName = `sport-${normalizedSport}`;
      
      // Search Unsplash with the custom search term
      console.log(`Finding better image for ${sport.label} using term: ${sport.searchTerm}...`);
      const photos = await searchUnsplashImages(sport.searchTerm);
      
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
  
  console.log('✅ Finished replacing additional sport images');
}

// Execute the main function
replaceMoreImages().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
}); 