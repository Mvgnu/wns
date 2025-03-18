/**
 * Script to download the Geist and Geist Mono fonts
 * Run with: node scripts/download-fonts.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FONTS_DIR = path.join(process.cwd(), 'public/fonts');
const GEIST_DIR = path.join(FONTS_DIR, 'geist');
const GEIST_MONO_DIR = path.join(FONTS_DIR, 'geist-mono');

// Ensure the font directories exist
[FONTS_DIR, GEIST_DIR, GEIST_MONO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Font files to download
const fonts = [
  {
    name: 'Geist Regular',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Regular.woff2',
    path: path.join(GEIST_DIR, 'Geist-Regular.woff2'),
    weight: 400,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist Medium',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Medium.woff2',
    path: path.join(GEIST_DIR, 'Geist-Medium.woff2'),
    weight: 500,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist SemiBold',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-SemiBold.woff2',
    path: path.join(GEIST_DIR, 'Geist-SemiBold.woff2'),
    weight: 600,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist Bold',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Bold.woff2',
    path: path.join(GEIST_DIR, 'Geist-Bold.woff2'),
    weight: 700,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist Light',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Light.woff2',
    path: path.join(GEIST_DIR, 'Geist-Light.woff2'),
    weight: 300,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist UltraLight',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-UltraLight.woff2',
    path: path.join(GEIST_DIR, 'Geist-UltraLight.woff2'),
    weight: 200,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist Thin',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Thin.woff2',
    path: path.join(GEIST_DIR, 'Geist-Thin.woff2'),
    weight: 100,
    style: 'normal',
    family: 'Geist'
  },
  {
    name: 'Geist Black',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-sans/Geist-Black.woff2',
    path: path.join(GEIST_DIR, 'Geist-Black.woff2'),
    weight: 900,
    style: 'normal',
    family: 'Geist'
  },
  // Geist Mono
  {
    name: 'Geist Mono Regular',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-mono/GeistMono-Regular.woff2',
    path: path.join(GEIST_MONO_DIR, 'GeistMono-Regular.woff2'),
    weight: 400,
    style: 'normal',
    family: 'Geist Mono'
  },
  {
    name: 'Geist Mono Medium',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-mono/GeistMono-Medium.woff2',
    path: path.join(GEIST_MONO_DIR, 'GeistMono-Medium.woff2'),
    weight: 500,
    style: 'normal',
    family: 'Geist Mono'
  },
  {
    name: 'Geist Mono Bold',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-mono/GeistMono-Bold.woff2',
    path: path.join(GEIST_MONO_DIR, 'GeistMono-Bold.woff2'),
    weight: 700,
    style: 'normal',
    family: 'Geist Mono'
  },
  {
    name: 'Geist Mono Light',
    url: 'https://raw.githubusercontent.com/vercel/geist-font/main/packages/next/dist/fonts/geist-mono/GeistMono-Light.woff2',
    path: path.join(GEIST_MONO_DIR, 'GeistMono-Light.woff2'),
    weight: 300,
    style: 'normal',
    family: 'Geist Mono'
  }
];

// Download function
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    // Check if file already exists
    if (fs.existsSync(dest)) {
      console.log(`File already exists: ${dest}`);
      return resolve();
    }
    
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Generate CSS for font-face declarations
function generateFontFaceCSS() {
  let css = '/* Local font declarations */\n\n';
  
  fonts.forEach(font => {
    const fontName = font.family === 'Geist' ? 'var(--font-geist-sans)' : 'var(--font-geist-mono)';
    const fontFamily = font.family;
    const fontPath = `/fonts/${font.family === 'Geist' ? 'geist' : 'geist-mono'}/${path.basename(font.path)}`;
    
    css += `@font-face {
  font-family: "${fontFamily}";
  src: url("${fontPath}") format("woff2");
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
}\n\n`;
  });
  
  return css;
}

// Download all fonts
async function downloadFonts() {
  console.log('Starting font downloads...');
  
  for (const font of fonts) {
    try {
      console.log(`Downloading ${font.name}...`);
      await downloadFile(font.url, font.path);
      console.log(`✅ Downloaded ${font.name}`);
    } catch (error) {
      console.error(`❌ Error downloading ${font.name}:`, error);
    }
  }
  
  // Generate CSS with @font-face declarations
  const css = generateFontFaceCSS();
  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), css);
  console.log('✅ Generated font-face CSS');
  
  console.log('✅ All fonts downloaded successfully!');
}

// Run the download function
downloadFonts().catch(err => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
}); 