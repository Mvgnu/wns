#!/usr/bin/env node

/**
 * This script applies the custom migration for adding missing columns
 * It can be run directly without requiring a full Prisma migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Helper to check if a column exists and add it if it doesn't
 */
async function ensureColumnExists(table, column, type) {
  try {
    // Check if the column exists
    const checkColumnSQL = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'
    `;
    
    const result = await prisma.$queryRawUnsafe(checkColumnSQL);
    const columnExists = result[0].count > 0;
    
    if (!columnExists) {
      console.log(`Adding ${column} column to ${table} table...`);
      const addColumnSQL = `ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`;
      await prisma.$executeRawUnsafe(addColumnSQL);
      console.log(`${column} column added to ${table} table.`);
    } else {
      console.log(`${column} column already exists in ${table} table.`);
    }
  } catch (error) {
    console.error(`Error ensuring ${column} column in ${table} table:`, error);
  }
}

/**
 * Create an index if it doesn't exist
 */
async function ensureIndexExists(table, columns) {
  try {
    const indexName = `${table}_${columns.join('_')}_idx`;
    
    // Check if the index exists
    const checkIndexSQL = `
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename = '${table}' AND indexname = '${indexName}'
    `;
    
    const result = await prisma.$queryRawUnsafe(checkIndexSQL);
    const indexExists = result[0].count > 0;
    
    if (!indexExists) {
      console.log(`Creating index on ${columns.join(', ')} columns in ${table} table...`);
      const createIndexSQL = `CREATE INDEX "${indexName}" ON "${table}" USING gist(${columns.map(col => `"${col}"`).join(', ')})`;
      await prisma.$executeRawUnsafe(createIndexSQL);
      console.log(`Index created on ${columns.join(', ')} columns in ${table} table.`);
    } else {
      console.log(`Index on ${columns.join(', ')} columns already exists in ${table} table.`);
    }
  } catch (error) {
    console.error(`Error ensuring index on ${columns.join(', ')} columns in ${table} table:`, error);
  }
}

async function main() {
  console.log('🔍 Checking database schema and applying fixes...');

  try {
    // Group table
    await ensureColumnExists('Group', 'latitude', 'DOUBLE PRECISION');
    await ensureColumnExists('Group', 'longitude', 'DOUBLE PRECISION');
    await ensureColumnExists('Group', 'locationName', 'TEXT');
    
    // Create index on latitude and longitude columns in Group table
    await ensureIndexExists('Group', ['latitude', 'longitude']);
    
    // User table
    await ensureColumnExists('User', 'latitude', 'DOUBLE PRECISION');
    await ensureColumnExists('User', 'longitude', 'DOUBLE PRECISION');
    
    // Create index on latitude and longitude columns in User table
    await ensureIndexExists('User', ['latitude', 'longitude']);
    
    // Location table
    await ensureColumnExists('Location', 'cityId', 'TEXT');
    await ensureColumnExists('Location', 'stateId', 'TEXT');
    await ensureColumnExists('Location', 'countryId', 'TEXT');
    
    console.log('✅ Schema updates completed successfully!');
  } catch (error) {
    console.error('❌ Error applying schema changes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('✨ All done!');
}

main().catch(e => {
  console.error('❌ Script error:', e);
  process.exit(1);
}); 