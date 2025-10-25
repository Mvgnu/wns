#!/usr/bin/env node

/**
 * Comprehensive test runner for all test types
 * Usage: node scripts/test-runner.js [type] [options]
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const testType = args[0] || 'all';
const options = args.slice(1);

console.log(`🧪 Running ${testType} tests...\n`);

// Set default port if not specified
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

const baseUrl = `http://localhost:${process.env.PORT}`;

async function runTests() {
  try {
    switch (testType) {
      case 'unit':
        console.log('🏃 Running unit tests with Vitest...');
        execSync('npm run test:unit', { stdio: 'inherit' });
        break;

      case 'integration':
        console.log('🔗 Running integration tests with Jest...');
        execSync('npm test', { stdio: 'inherit' });
        break;

      case 'api':
        console.log('🔌 Running API tests with Jest...');
        execSync('npm run test:api', { stdio: 'inherit' });
        break;

      case 'e2e':
        console.log('🌐 Running E2E tests with Playwright...');
        execSync('npm run test:e2e', { stdio: 'inherit' });
        break;

      case 'coverage':
        console.log('📊 Running tests with coverage...');
        execSync('npm run test:coverage', { stdio: 'inherit' });
        break;

      case 'all':
        console.log('🚀 Running all tests...\n');

        console.log('📦 Step 1: Setting up test database...');
        execSync('npm run db:verify', { stdio: 'inherit' });

        console.log('\n🏃 Step 2: Running unit tests...');
        execSync('npm run test:unit', { stdio: 'inherit' });

        console.log('\n🔗 Step 3: Running integration tests...');
        execSync('npm test', { stdio: 'inherit' });

        console.log('\n🔌 Step 4: Running API tests...');
        execSync('find tests/api -name "*.test.ts" -exec npm test -- {} +', { stdio: 'inherit' });

        console.log('\n✅ All tests completed successfully!');
        break;

      default:
        console.log('Available test types:');
        console.log('  - unit: Run unit tests (Vitest)');
        console.log('  - integration: Run integration tests (Jest)');
        console.log('  - api: Run API route tests (Jest)');
        console.log('  - e2e: Run end-to-end tests (Playwright)');
        console.log('  - coverage: Run tests with coverage report');
        console.log('  - all: Run all tests');
        console.log('\nUsage: node scripts/test-runner.js <type> [options]');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Tests failed: ${error.message}`);
    process.exit(1);
  }
}

runTests();
