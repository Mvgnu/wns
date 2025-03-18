"use strict";
'use server';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSportImages = exports.getSportImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const react_1 = require("react");
// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'd0EeF4h-pxmGEky32qBiTzZuEA3rTG7ly8AnDoH-INQ';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const IMAGE_DIRECTORY = path_1.default.join(process.cwd(), 'public/images/sports');
// Make sure the sports images directory exists
try {
    if (!fs_1.default.existsSync(IMAGE_DIRECTORY)) {
        fs_1.default.mkdirSync(IMAGE_DIRECTORY, { recursive: true });
    }
}
catch (error) {
    console.error('Error creating image directory:', error);
}
/**
 * Search for images on Unsplash
 */
async function searchUnsplashImages(query, orientation = 'landscape') {
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
        const data = await response.json();
        return data.results;
    }
    catch (error) {
        console.error(`Error searching Unsplash for "${query}":`, error);
        return [];
    }
}
/**
 * Download an image from Unsplash and save it locally
 */
async function downloadUnsplashImage(photo, fileName) {
    const filePath = path_1.default.join(IMAGE_DIRECTORY, `${fileName}.jpg`);
    const relativePath = `/images/sports/${fileName}.jpg`;
    // Check if the file already exists
    if (fs_1.default.existsSync(filePath)) {
        return relativePath;
    }
    try {
        const response = await fetch(photo.urls.regular);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        fs_1.default.writeFileSync(filePath, buffer);
        return relativePath;
    }
    catch (error) {
        console.error(`Error downloading image ${fileName}:`, error);
        return '';
    }
}
/**
 * Get an image for a sport, downloading it from Unsplash if needed
 */
exports.getSportImage = (0, react_1.cache)(async (sport) => {
    // Normalize sport name for file naming
    const normalizedSport = sport.toLowerCase().replace(/\s+/g, '-');
    const fileName = `sport-${normalizedSport}`;
    const filePath = path_1.default.join(IMAGE_DIRECTORY, `${fileName}.jpg`);
    const relativePath = `/images/sports/${fileName}.jpg`;
    // Return cached image if it exists
    if (fs_1.default.existsSync(filePath)) {
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
exports.getSportImages = (0, react_1.cache)(async (sports) => {
    const results = {};
    await Promise.all(sports.map(async (sport) => {
        results[sport] = await (0, exports.getSportImage)(sport);
    }));
    return results;
});
