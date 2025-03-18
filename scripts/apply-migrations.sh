#!/bin/bash

echo "Beginning database migration process..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Format the Prisma schema
echo "Formatting Prisma schema..."
npx prisma format

# Create a migration
echo "Creating a migration..."
read -p "Enter a name for this migration: " migration_name
npx prisma migrate dev --name "$migration_name"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Migration complete!"
echo "Don't forget to restart your development server if it's running." 