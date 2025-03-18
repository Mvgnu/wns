/**
 * Script to verify that all sport images referenced in sportsData.ts exist in the /public/images/sports directory.
 * This helps identify any missing images or naming mismatches.
 */

// We need to use CommonJS require since this is a Node script
const fs = require('fs');
const path = require('path');

try {
  // Read the sports data file content
  const sportsDataPath = path.join(__dirname, '../lib/sportsData.ts');
  const sportsDataContent = fs.readFileSync(sportsDataPath, 'utf8');
  
  // Extract sports using regex to parse the allSports array
  const allSportsRegex = /export\s+const\s+allSports\s*:\s*Sport\[\]\s*=\s*\[([\s\S]*?)\];/;
  const allSportsMatch = sportsDataContent.match(allSportsRegex);
  
  if (!allSportsMatch) {
    console.error('Could not find allSports array in sportsData.ts');
    process.exit(1);
  }
  
  const allSportsData = allSportsMatch[1];
  
  // Extract sport values using regex
  const sportValueRegex = /value\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  const sports = [];
  
  while ((match = sportValueRegex.exec(allSportsData)) !== null) {
    sports.push(match[1]);
  }
  
  console.log(`Found ${sports.length} sports in sportsData.ts:`);
  console.log(sports);
  
  // Read the images directory
  const imagesDir = path.join(__dirname, '../public/images/sports');
  let imageFiles = [];
  
  try {
    imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'));
    
    console.log(`\nFound ${imageFiles.length} image files in ${imagesDir}:`);
    console.log(imageFiles);
  } catch (error) {
    console.error(`Error reading images directory: ${error.message}`);
    process.exit(1);
  }
  
  // Check if each sport has a corresponding image
  console.log('\nChecking for matches:');
  
  const matched = [];
  const missing = [];
  
  sports.forEach(sport => {
    // Create potential filenames with the 'sport-' prefix
    const filenameWithUnderscores = `sport-${sport}.jpg`;
    const filenameWithHyphens = `sport-${sport.replace(/_/g, '-')}.jpg`;
    
    // Check if the file exists with either naming convention
    if (imageFiles.includes(filenameWithUnderscores)) {
      matched.push({ sport, file: filenameWithUnderscores });
    } else if (imageFiles.includes(filenameWithHyphens)) {
      matched.push({ sport, file: filenameWithHyphens });
    } else {
      missing.push(sport);
    }
  });
  
  // Check for unmatched images (images without corresponding sports)
  const unmatched = imageFiles.filter(file => {
    // Extract sport value from filename (removing 'sport-' prefix and extension)
    const sportPart = file.replace(/^sport-/, '').replace(/\.[^.]+$/, '');
    const sportWithUnderscores = sportPart.replace(/-/g, '_');
    
    return !sports.includes(sportPart) && !sports.includes(sportWithUnderscores);
  });
  
  // Print results
  console.log(`\n✅ Matched ${matched.length} sports with images:`);
  matched.forEach(({ sport, file }) => {
    console.log(`  - ${sport} → ${file}`);
  });
  
  console.log(`\n❌ Missing images for ${missing.length} sports:`);
  missing.forEach(sport => {
    console.log(`  - ${sport} (needed files: sport-${sport}.jpg or sport-${sport.replace(/_/g, '-')}.jpg)`);
  });
  
  console.log(`\n⚠️ Found ${unmatched.length} unmatched image files (no corresponding sport):`);
  unmatched.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  if (missing.length === 0 && unmatched.length === 0) {
    console.log('\n🎉 All sports have matching images and all images have matching sports!');
  }
  
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} 