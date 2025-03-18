#!/usr/bin/env node

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function executeCommand(command, silent = false) {
  return new Promise((resolve, reject) => {
    if (!silent) {
      console.log(`${colors.blue}Executing: ${command}${colors.reset}`);
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      if (stderr && !silent) {
        console.error(`${colors.yellow}${stderr}${colors.reset}`);
      }
      
      if (stdout && !silent) {
        console.log(`${colors.green}${stdout}${colors.reset}`);
      }
      
      resolve({ stdout, stderr });
    });
  });
}

async function checkPrismaStatus() {
  try {
    console.log(`${colors.cyan}Checking Prisma schema status...${colors.reset}`);
    const { stdout } = await executeCommand('npx prisma format', true);
    
    // Check if there are pending migrations
    const { stdout: diffOutput } = await executeCommand('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code', true);
    
    console.log(`${colors.green}Prisma schema is formatted.${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}Schema may have changes that need migration.${colors.reset}`);
    return false;
  }
}

async function backupDatabase() {
  const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  const backupPath = path.join(backupDir, `db-backup-${date}.sql`);
  
  console.log(`${colors.cyan}Creating database backup...${colors.reset}`);
  
  try {
    // Extract database URL components
    const dbUrlMatch = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!dbUrlMatch) {
      throw new Error('Could not parse DATABASE_URL');
    }
    
    const [, username, password, host, port, dbname] = dbUrlMatch;
    
    // Use pg_dump for backup
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbname} -f "${backupPath}"`;
    
    await executeCommand(pgDumpCmd);
    console.log(`${colors.green}Database backup created at: ${backupPath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to create database backup: ${error.message}${colors.reset}`);
    return false;
  }
}

async function generateMigration(name) {
  try {
    console.log(`${colors.cyan}Generating migration: ${name}...${colors.reset}`);
    await executeCommand(`npx prisma migrate dev --name ${name} --create-only`);
    console.log(`${colors.green}Migration created successfully.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to generate migration: ${error.message}${colors.reset}`);
    return false;
  }
}

async function applyMigration() {
  try {
    console.log(`${colors.cyan}Applying migration...${colors.reset}`);
    await executeCommand('npx prisma migrate deploy');
    await executeCommand('npx prisma generate');
    console.log(`${colors.green}Migration applied successfully.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to apply migration: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runMigration() {
  try {
    // 1. Check Prisma status
    await checkPrismaStatus();
    
    // 2. Ask for migration name
    rl.question(`${colors.cyan}Enter a name for this migration: ${colors.reset}`, async (name) => {
      // Sanitize the migration name (remove spaces, special chars)
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      // 3. Backup database
      const backupSuccess = await backupDatabase();
      if (!backupSuccess) {
        rl.question(`${colors.yellow}Continue without backup? (y/N): ${colors.reset}`, async (answer) => {
          if (answer.toLowerCase() !== 'y') {
            console.log(`${colors.red}Migration aborted.${colors.reset}`);
            rl.close();
            return;
          }
          continueWithMigration(sanitizedName);
        });
      } else {
        await continueWithMigration(sanitizedName);
      }
    });
  } catch (error) {
    console.error(`${colors.red}Migration process failed: ${error.message}${colors.reset}`);
    rl.close();
  }
}

async function continueWithMigration(name) {
  // 4. Generate migration
  const generationSuccess = await generateMigration(name);
  
  if (!generationSuccess) {
    rl.question(`${colors.yellow}Migration generation had issues. Continue? (y/N): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log(`${colors.red}Migration aborted.${colors.reset}`);
        rl.close();
        return;
      }
      
      // 5. Apply migration
      await applyMigration();
      rl.close();
    });
  } else {
    // 5. Ask to apply migration
    rl.question(`${colors.cyan}Apply the migration now? (Y/n): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() === 'n') {
        console.log(`${colors.yellow}Migration not applied. You can apply it later with 'npx prisma migrate deploy'.${colors.reset}`);
        rl.close();
        return;
      }
      
      // Apply migration
      await applyMigration();
      rl.close();
    });
  }
}

// Run the migration process
runMigration(); 