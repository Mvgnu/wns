const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Create a blue circle with white X as a png first
async function generateFavicon() {
  console.log('Creating favicon.ico...');
  
  // Create a simple SVG buffer directly without using the file
  const svgBuffer = Buffer.from(`
    <svg width="64" height="64" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#3B82F6"/>
      <path d="M16 6L16 26" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 12L22 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 20L22 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `);

  try {
    // Generate apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('✅ Created apple-touch-icon.png');
    
    // Generate favicons of various sizes and save them directly
    const sizes = [16, 32, 48, 64, 128, 256];
    
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(ICONS_DIR, `favicon-${size}.png`));
      console.log(`✅ Created favicon-${size}.png`);
    }
    
    // For favicon.ico, we'll just copy the 32x32 version for now
    // In a production environment, you would use a proper ICO generation library
    fs.copyFileSync(
      path.join(ICONS_DIR, 'favicon-32.png'),
      path.join(PUBLIC_DIR, 'favicon.ico')
    );
    console.log('✅ Created favicon.ico (from 32x32 PNG)');
    
    console.log('✅ Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

// Run the function
generateFavicon().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 