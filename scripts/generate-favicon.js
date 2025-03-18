const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pngToIco = require('png-to-ico');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateFavicon() {
  console.log('Generating favicon.ico from SVG...');
  
  // Convert SVG to PNG in different sizes
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngFiles = [];
  
  for (const size of sizes) {
    const outputFile = path.join(ICONS_DIR, `favicon-${size}.png`);
    pngFiles.push(outputFile);
    
    console.log(`Converting SVG to ${size}x${size} PNG...`);
    try {
      // Use the installed svg2png-cli to convert SVG to PNG
      execSync(`npx svg2png-cli -i ${path.join(PUBLIC_DIR, 'favicon.svg')} -o ${outputFile} -w ${size} -h ${size}`);
      console.log(`✅ Created ${outputFile}`);
    } catch (error) {
      console.error(`Error converting to ${size}x${size} PNG:`, error);
      process.exit(1);
    }
  }
  
  // Convert PNGs to ICO
  try {
    console.log('Converting PNGs to ICO...');
    const icoBuffer = await pngToIco(pngFiles);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
    console.log('✅ Created favicon.ico');
    
    // Create Apple Touch Icon (180x180)
    console.log('Creating Apple Touch Icon...');
    execSync(`npx svg2png-cli -i ${path.join(PUBLIC_DIR, 'favicon.svg')} -o ${path.join(ICONS_DIR, 'apple-touch-icon.png')} -w 180 -h 180`);
    console.log('✅ Created apple-touch-icon.png');
    
    // Clean up temporary PNG files
    for (const file of pngFiles) {
      fs.unlinkSync(file);
    }
    console.log('🧹 Cleaned up temporary files');
    
  } catch (error) {
    console.error('Error creating ICO file:', error);
    process.exit(1);
  }
  
  console.log('✅ Favicon generation complete!');
}

// Run the function
generateFavicon().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 