#!/usr/bin/env node

/**
 * Schema Verification and Auto-Fix Script
 * 
 * This script examines the database schema and ensures all required columns exist.
 * It compares the actual database schema with what the application expects and
 * automatically adds any missing columns with appropriate defaults.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error']
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
 * Check if a column exists in a table
 */
async function columnExists(table, column) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'
    `);
    return result[0].count > 0;
  } catch (error) {
    console.error(`Error checking if column ${column} exists in ${table}:`, error);
    return false;
  }
}

/**
 * Add a column to a table if it doesn't exist
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
        ADD COLUMN "${column}" ${type} DEFAULT ${defaultValue}
      `);
      
      console.log(`✅ Added ${column} to ${table}`);
      return true;
    } else {
      console.log(`✓ Column ${table}.${column} already exists`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to add column ${column} to ${table}:`, error);
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
    
    // Check if index exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename = '${table}' AND indexname = '${indexName}'
    `);
    
    if (result[0].count === 0) {
      console.log(`Creating index on ${table}(${columns.join(', ')})`);
      
      // For lat/long, use a geographic index
      if (columns.includes('latitude') && columns.includes('longitude')) {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "${indexName}" ON "${table}" (${columns.map(c => `"${c}"`).join(', ')})
        `);
      } else {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "${indexName}" ON "${table}" (${columns.map(c => `"${c}"`).join(', ')})
        `);
      }
      
      console.log(`✅ Created index ${indexName}`);
      return true;
    } else {
      console.log(`✓ Index already exists on ${table}(${columns.join(', ')})`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to create index on ${table}(${columns.join(', ')}):`, error);
    return false;
  }
}

/**
 * Verify and fix schema for all models
 */
async function verifyAndFixSchema() {
  console.log('📊 Beginning schema verification and auto-fix...');
  let changesApplied = 0;
  
  for (const [model, columns] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`\n🔍 Checking schema for ${model}...`);
    
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

// Main execution
async function main() {
  try {
    await verifyAndFixSchema();
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 