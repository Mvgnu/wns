#!/usr/bin/env node

/**
 * Find Unused Imports
 * 
 * This script analyzes TypeScript and JavaScript files to identify 
 * potentially unused imports that may be contributing to bundle bloat.
 * 
 * Usage:
 *   node scripts/find-unused-imports.js [directory]
 * 
 * Arguments:
 *   directory - Optional. Directory to scan (default: app, components, lib)
 * 
 * Example:
 *   node scripts/find-unused-imports.js components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DEFAULT_DIRS = ['app', 'components', 'lib'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'public', 'styles', 'dist'];
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Color formatting
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// Statistics
const stats = {
  filesScanned: 0,
  potentialUnusedImports: 0,
  heavyImports: 0,
};

// Parse command line arguments
const args = process.argv.slice(2);
let targetDirs = args.length > 0 ? [args[0]] : DEFAULT_DIRS;

console.log(`${COLORS.cyan}Scanning for unused imports...${COLORS.reset}`);

// List of known heavy dependencies that should be carefully evaluated
const HEAVY_PACKAGES = [
  'lodash',
  '@mui/material',
  'chart.js',
  'leaflet',
  'react-leaflet',
  '@tiptap/react',
  '@tiptap/extension-image',
  '@radix-ui',
  'date-fns',
  '@headlessui/react',
  'react-hook-form',
  'draft-js',
  'quill',
  '@ckeditor',
  'three',
];

// Regular expressions
const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/g;
const singleImportRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/;
const namedImportsRegex = /{([^}]+)}/;

/**
 * Check if a file contains usage of a specific symbol
 */
function containsSymbol(fileContent, symbol) {
  const cleanSymbol = symbol.trim();
  
  // Skip checking for common React imports that might be used in JSX
  if (['React', 'Fragment', 'Suspense', 'useState', 'useEffect'].includes(cleanSymbol)) {
    return true;
  }
  
  // Create a regex that looks for the symbol but not as part of another word
  // This helps avoid false positives
  const symbolRegex = new RegExp(`[^a-zA-Z0-9_$]${cleanSymbol}[^a-zA-Z0-9_$]|^${cleanSymbol}[^a-zA-Z0-9_$]|[^a-zA-Z0-9_$]${cleanSymbol}$|^${cleanSymbol}$`, 'g');
  
  return symbolRegex.test(fileContent);
}

/**
 * Process a single file to find unused imports
 */
function processFile(filePath) {
  if (!FILE_EXTENSIONS.includes(path.extname(filePath))) {
    return;
  }
  
  try {
    stats.filesScanned++;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let unusedImports = [];
    let match;
    
    // Reset regex state
    importRegex.lastIndex = 0;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      const [fullImport, namedImports, namespaceImport, defaultImport, packageName] = match;
      
      // Check if importing a heavy package
      if (HEAVY_PACKAGES.some(pkg => packageName.includes(pkg))) {
        stats.heavyImports++;
        console.log(`${COLORS.yellow}[HEAVY] ${COLORS.reset}${filePath}: ${COLORS.yellow}${packageName}${COLORS.reset}`);
      }
      
      if (namedImports) {
        // Handle named imports like: import { a, b as c } from 'package'
        const imports = namedImports.split(',').map(i => {
          const trimmed = i.trim();
          const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
          return asMatch ? asMatch[2] : trimmed;
        });
        
        for (const symbolName of imports) {
          if (symbolName && !containsSymbol(fileContent, symbolName)) {
            unusedImports.push({ symbol: symbolName, package: packageName, type: 'named' });
          }
        }
      } else if (namespaceImport) {
        // Handle namespace imports like: import * as name from 'package'
        if (!containsSymbol(fileContent, namespaceImport)) {
          unusedImports.push({ symbol: namespaceImport, package: packageName, type: 'namespace' });
        }
      } else if (defaultImport) {
        // Handle default imports like: import name from 'package'
        if (!containsSymbol(fileContent, defaultImport)) {
          unusedImports.push({ symbol: defaultImport, package: packageName, type: 'default' });
        }
      }
    }
    
    if (unusedImports.length > 0) {
      console.log(`${COLORS.magenta}${filePath}${COLORS.reset}`);
      unusedImports.forEach(({ symbol, package: pkg, type }) => {
        stats.potentialUnusedImports++;
        console.log(`  ${COLORS.red}Potentially unused:${COLORS.reset} ${symbol} ${COLORS.cyan}(${type})${COLORS.reset} from ${pkg}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

/**
 * Walk a directory and process all relevant files
 */
function walkDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error walking directory ${dir}:`, error.message);
  }
}

// Main execution
try {
  console.log(`${COLORS.blue}Target directories:${COLORS.reset} ${targetDirs.join(', ')}\n`);
  
  for (const dir of targetDirs) {
    const dirPath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath);
    } else {
      console.error(`Directory not found: ${dirPath}`);
    }
  }
  
  // Print summary statistics
  console.log('\n=== Summary ===');
  console.log(`${COLORS.green}Files scanned:${COLORS.reset} ${stats.filesScanned}`);
  console.log(`${COLORS.red}Potential unused imports:${COLORS.reset} ${stats.potentialUnusedImports}`);
  console.log(`${COLORS.yellow}Heavy package imports:${COLORS.reset} ${stats.heavyImports}`);
  
  // Suggest next steps
  console.log('\n=== Next Steps ===');
  console.log('1. Review the potentially unused imports - they may be false positives');
  console.log('2. Consider replacing heavy packages with lighter alternatives');
  console.log('3. Use dynamic imports for components only needed in specific situations');
  console.log('4. Look into code splitting to reduce initial bundle size');
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 