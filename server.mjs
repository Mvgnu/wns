import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import portfinder from 'portfinder';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we are in development or production mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the cron scheduler (dynamically to avoid issues with Next.js)
let cronScheduler;

// Configure portfinder
portfinder.basePort = parseInt(process.env.PORT, 10) || 3000;
portfinder.highestPort = 3100;

// Safely load cron service
const loadCronService = async () => {
  try {
    // Determine the correct path based on environment
    const cronPath = dev 
      ? './dist/lib/cronService.js' // Development (compiled)
      : './dist/lib/cronService.js'; // Production
    
    console.log(`> Attempting to load cron service from: ${cronPath}`);
    
    // Check if the file exists
    if (fs.existsSync(join(__dirname, cronPath))) {
      const module = await import(join(__dirname, cronPath));
      
      if (module && typeof module.startCronScheduler === 'function') {
        cronScheduler = module;
        cronScheduler.startCronScheduler();
        console.log('> ✅ Cron scheduler started successfully');
        return true;
      } else {
        console.error('> ❌ Cron module found but startCronScheduler function is missing');
      }
    } else {
      console.error(`> ❌ Cron service file not found at: ${join(__dirname, cronPath)}`);
    }
  } catch (error) {
    console.error('> ❌ Failed to load cron service:', error);
  }
  
  // Fallback to mock implementation if the real one fails
  console.log('> ⚠️ Using mock cron scheduler');
  cronScheduler = {
    startCronScheduler: () => {
      console.log('> Mock cron scheduler started');
    },
    stopCronScheduler: () => {
      console.log('> Mock cron scheduler stopped');
    }
  };
  return false;
};

// Prepare the Next.js app
app.prepare().then(async () => {
  // Create the HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  try {
    // Find an available port
    const port = await portfinder.getPortPromise();
    
    // Start the server on the available port
    server.listen(port, async (err) => {
      if (err) throw err;
      
      console.log(`> Ready on http://localhost:${port}`);
      if (port !== portfinder.basePort) {
        console.log(`> Default port ${portfinder.basePort} was already in use, using port ${port} instead`);
      }
      
      // Load and start the cron scheduler
      await loadCronService();
    });
  } catch (err) {
    console.error('Could not find an available port:', err);
    process.exit(1);
  }

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, stopping server and cron jobs...');
    
    // Stop the cron scheduler if it was started
    if (cronScheduler && typeof cronScheduler.stopCronScheduler === 'function') {
      try {
        cronScheduler.stopCronScheduler();
        console.log('> Cron scheduler stopped successfully');
      } catch (error) {
        console.error('Error stopping cron scheduler:', error);
      }
    }
    
    server.close(() => {
      console.log('Server stopped, process will now exit');
      process.exit(0);
    });
  };

  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}); 