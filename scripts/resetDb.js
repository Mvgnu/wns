#!/usr/bin/env node
/**
 * Database Reset Script
 * This script:
 * 1. Drops the current database if it exists
 * 2. Creates a new database
 * 3. Runs migrations
 * 4. Seeds the database with initial data
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');
const readline = require('readline');

// Configure paths
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');
const envFile = path.join(rootDir, '.env.development.local');

// Create logs dir if it doesn't exist
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Prompt for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Database Reset Tool');
console.log('----------------------');
console.log('⚠️ WARNING: This will DELETE your current database and create a new one!');
console.log('All existing data will be lost.');

rl.question('Are you sure you want to continue? (y/N): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation canceled.');
    rl.close();
    return;
  }
  
  rl.close();
  resetDatabase();
});

function executeCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const output = execSync(command, { cwd: rootDir, stdio: 'pipe' }).toString();
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    
    // Extract DATABASE_URL from .env file for better error reporting
    try {
      const dotenv = require('dotenv');
      const env = dotenv.config({ path: envFile }).parsed;
      const dbUrl = env?.DATABASE_URL || 'Not found';
      console.log(`Current DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);
    } catch (e) {
      console.log('Could not read DATABASE_URL from .env file');
    }
    
    process.exit(1);
  }
}

function resetDatabase() {
  try {
    console.log('\n🔄 Starting database reset process...');
    
    // 1. Drop the database schema
    executeCommand('npx prisma migrate reset --force', 'Resetting database schema');
    
    // 2. Run migrations
    executeCommand('npx prisma migrate dev --name init', 'Running migrations');
    
    // 3. Generate Prisma client
    executeCommand('npx prisma generate', 'Generating Prisma client');
    
    // 4. Seed the database
    executeCommand('npx prisma db seed', 'Seeding database');
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('You can now start your application.');
  } catch (error) {
    console.error('\n❌ Database reset failed:');
    console.error(error);
    process.exit(1);
  }
} 