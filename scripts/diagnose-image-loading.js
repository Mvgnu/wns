/**
 * Diagnose Image Loading Issues
 * 
 * This script checks the public/images/sports directory and lists all images,
 * verifying they exist and are accessible. It also checks for proper naming conventions.
 */

const fs = require('fs');
const path = require('path');

// Get the absolute path to the public directory
const publicDir = path.join(__dirname, '../public');
const sportsImagesDir = path.join(publicDir, 'images/sports');

console.log('=== DIAGNOSING IMAGE LOADING ISSUES ===');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Public directory path: ${publicDir}`);
console.log(`Sports images directory path: ${sportsImagesDir}`);

// Check if the directory exists
console.log('\nChecking if directories exist:');
console.log(`Public directory exists: ${fs.existsSync(publicDir)}`);
console.log(`Images directory exists: ${fs.existsSync(path.join(publicDir, 'images'))}`);
console.log(`Sports images directory exists: ${fs.existsSync(sportsImagesDir)}`);

// List all files in the sports images directory
console.log('\nListing all files in sports images directory:');
try {
  const files = fs.readdirSync(sportsImagesDir);
  
  console.log(`Found ${files.length} files:`);
  files.forEach(file => {
    const filePath = path.join(sportsImagesDir, file);
    const stats = fs.statSync(filePath);
    const isFile = stats.isFile();
    const fileSize = stats.size;
    
    console.log(`- ${file} (${isFile ? 'File' : 'Directory'}, ${fileSize} bytes)`);
    
    // Check if it follows our naming convention
    const isCorrectNaming = /^sport-[a-z0-9_-]+\.(jpg|png|jpeg)$/i.test(file);
    if (!isCorrectNaming) {
      console.log(`  ⚠️ WARNING: This file doesn't follow the expected naming convention (sport-name.jpg)`);
    }
    
    // Check if file is readable
    try {
      const fd = fs.openSync(filePath, 'r');
      fs.closeSync(fd);
      console.log(`  ✅ File is readable`);
    } catch (err) {
      console.log(`  ❌ ERROR: File is not readable: ${err.message}`);
    }
  });
} catch (error) {
  console.error(`Error reading sports images directory: ${error.message}`);
}

// Try simulating what the getSportImagePath function does
console.log('\nSimulating getSportImagePath functionality:');
const testSports = ['soccer', 'basketball', 'mountain_biking', 'yoga'];

testSports.forEach(sport => {
  console.log(`\nTesting sport: ${sport}`);
  
  // Create the expected image path
  const normalizedSport = sport.replace(/\s+/g, '_');
  const imagePath = `/images/sports/sport-${normalizedSport}.jpg`;
  const fullPath = path.join(publicDir, imagePath.substring(1));
  
  console.log(`Expected image path: ${imagePath}`);
  console.log(`Full filesystem path: ${fullPath}`);
  console.log(`File exists: ${fs.existsSync(fullPath)}`);
  
  // Try with hyphen variant
  const hyphenSport = sport.replace(/_/g, '-');
  const alternateImagePath = `/images/sports/sport-${hyphenSport}.jpg`;
  const alternateFullPath = path.join(publicDir, alternateImagePath.substring(1));
  
  console.log(`Alternate image path: ${alternateImagePath}`);
  console.log(`Alternate full path: ${alternateFullPath}`);
  console.log(`Alternate file exists: ${fs.existsSync(alternateFullPath)}`);
});

console.log('\n=== DIAGNOSTICS COMPLETE ==='); 