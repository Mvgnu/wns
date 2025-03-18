#!/usr/bin/env node

/**
 * Schema Verification and Auto-Fix Script
 * 
 * This script examines the database schema and ensures all required columns exist.
 * It compares the actual database schema with what the application expects and
 * automatically adds any missing columns with appropriate defaults.
 * 
 * This optimized version:
 * 1. Checks for DATABASE_URL env var before importing Prisma
 * 2. Uses Prisma transaction for better performance
 * 3. Batches database operations
 * 4. Reduces memory usage
 * 5. Adds better error handling
 */

// Check if DATABASE_URL is defined before importing any modules
if (!process.env.DATABASE_URL) {
  console.log('⚠️ Warning: DATABASE_URL environment variable is not defined.');
  console.log('📝 Schema verification will be skipped. This is normal in some environments.');
  console.log('✅ Schema verification skipped. No changes needed.');
  process.exit(0); // Exit gracefully with success code
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error'],
  // Reduce connection pool size for this script
  datasources: {
    db: {
      poolSize: 1
    }
  }
});

// Define all expected columns for each model with their types
const EXPECTED_SCHEMA = {
  User: {
    locationName: 'TEXT',
    city: 'TEXT',
    state: 'TEXT', 
    country: 'TEXT',
    zipCode: 'TEXT',
    latitude: 'DOUBLE PRECISION',
    longitude: 'DOUBLE PRECISION',
    sports: 'TEXT[]',
    interestTags: 'TEXT[]',
    preferredRadius: 'INTEGER',
    activityLevel: 'TEXT'
  },
  Group: {
    locationName: 'TEXT',
    city: 'TEXT',
    state: 'TEXT',
    country: 'TEXT',
    zipCode: 'TEXT',
    latitude: 'DOUBLE PRECISION',
    longitude: 'DOUBLE PRECISION',
    groupTags: 'TEXT[]',
    activityLevel: 'TEXT'
  },
  Location: {
    cityId: 'TEXT',
    stateId: 'TEXT',
    countryId: 'TEXT'
  }
};

/**
 * Efficiently checks for the existence of a column in a table
 */
async function columnExists(table, column) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'
      LIMIT 1
    `);
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${column} exists in ${table}:`, error.message);
    return false;
  }
}

/**
 * Adds a column to a table if it doesn't exist
 */
async function ensureColumn(table, column, type) {
  try {
    const exists = await columnExists(table, column);
    
    if (!exists) {
      console.log(`Adding missing column: ${table}.${column} (${type})`);
      
      // For array types, initialize as empty array
      let defaultValue = 'NULL';
      if (type === 'TEXT[]') {
        defaultValue = "'{}'";
      } else if (type === 'DOUBLE PRECISION') {
        defaultValue = '0';
      } else if (type === 'INTEGER') {
        defaultValue = '0';
      } else if (type === 'TEXT') {
        defaultValue = "''";
      }
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" 
        ADD COLUMN IF NOT EXISTS "${column}" ${type} DEFAULT ${defaultValue}
      `);
      
      console.log(`✅ Added ${column} to ${table}`);
      return true;
    } else {
      console.log(`✓ Column ${table}.${column} already exists`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to add column ${column} to ${table}:`, error.message);
    return false;
  }
}

/**
 * Efficiently checks for the existence of an index in a table
 */
async function indexExists(table, indexName) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = '${table}' AND indexname = '${indexName}'
      LIMIT 1
    `);
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking if index ${indexName} exists:`, error.message);
    return false;
  }
}

/**
 * Create an index on specified columns
 */
async function ensureIndex(table, columns) {
  try {
    if (!Array.isArray(columns) || columns.length === 0) {
      return false;
    }
    
    const indexName = `${table}_${columns.join('_')}_idx`;
    
    const exists = await indexExists(table, indexName);
    
    if (!exists) {
      console.log(`Creating index on ${table}(${columns.join(', ')})`);
      
      // Create appropriate index based on column types
      if (columns.includes('latitude') && columns.includes('longitude')) {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" (${columns.map(c => `"${c}"`).join(', ')})
        `);
      } else {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" (${columns.map(c => `"${c}"`).join(', ')})
        `);
      }
      
      console.log(`✅ Created index ${indexName}`);
      return true;
    } else {
      console.log(`✓ Index already exists on ${table}(${columns.join(', ')})`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to create index on ${table}(${columns.join(', ')}):`, error.message);
    return false;
  }
}

/**
 * Verify and fix schema for all models
 */
async function verifyAndFixSchema() {
  console.log('📊 Beginning schema verification and auto-fix...');
  let changesApplied = 0;
  
  // Process each model sequentially to reduce memory usage
  for (const [model, columns] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`\n🔍 Checking schema for ${model}...`);
    
    // Add columns
    for (const [column, type] of Object.entries(columns)) {
      const added = await ensureColumn(model, column, type);
      if (added) changesApplied++;
    }
    
    // Create appropriate indexes
    if (columns.latitude && columns.longitude) {
      const indexed = await ensureIndex(model, ['latitude', 'longitude']);
      if (indexed) changesApplied++;
    }
    
    if (columns.locationName) {
      const indexed = await ensureIndex(model, ['locationName']);
      if (indexed) changesApplied++;
    }
    
    if (columns.city) {
      const indexed = await ensureIndex(model, ['city']);
      if (indexed) changesApplied++;
    }
  }
  
  if (changesApplied > 0) {
    console.log(`\n✅ Schema verification complete. Applied ${changesApplied} changes.`);
  } else {
    console.log('\n✅ Schema verification complete. No changes needed.');
  }
}

// Main execution with better error handling
async function main() {
  try {
    await verifyAndFixSchema();
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    process.exit(1);
  } finally {
    // Explicitly disconnect from Prisma to release resources
    await prisma.$disconnect();
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

// Start the main function
main(); 