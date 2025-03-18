const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get a list of all API route files
try {
  const apiRouteFiles = execSync('find app -type f -name "route.ts" -o -name "route.tsx"', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  console.log(`Found ${apiRouteFiles.length} API route files`);

  // For each API route file, add the force-static export
  for (const file of apiRouteFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip if the file already has force-static
      if (content.includes('dynamic = "force-static"')) {
        console.log(`Skipping ${file} - Already has force-static`);
        continue;
      }
      
      let updatedContent;
      
      // Check if the file has 'use server' directive
      if (content.trim().startsWith("'use server'") || content.trim().startsWith('"use server"')) {
        // Insert after the 'use server' directive and any following blank lines
        const lines = content.split('\n');
        let firstNonServerLine = 1;
        
        while (firstNonServerLine < lines.length && 
               (lines[firstNonServerLine].trim() === '' || 
                lines[firstNonServerLine].trim().startsWith('//'))) {
          firstNonServerLine++;
        }
        
        lines.splice(firstNonServerLine, 0, 'export const dynamic = "force-static";');
        updatedContent = lines.join('\n');
      } else {
        // Add the force-static export to the top of the file
        updatedContent = `export const dynamic = "force-static";\n${content}`;
      }
      
      fs.writeFileSync(file, updatedContent);
      console.log(`Added force-static to ${file}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  
  console.log('Completed adding force-static to API routes');
} catch (err) {
  console.error('Error finding API routes:', err);
} 