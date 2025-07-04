#!/bin/bash

set -e

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "Generating migration for Places enhancement..."

# Create migration with specific name
npx prisma migrate dev --name enhance_places_schema --create-only

echo "Migration files created."
echo "Reviewing migration files. Please check them to ensure correctness."

# Wait for user confirmation
read -p "Ready to apply migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Migration aborted."
    exit 1
fi

# Apply the migration
echo "Applying database migration..."
npx prisma migrate dev

# Run the data migration script
echo "Running data migration..."
npx ts-node prisma/migrations/data_migration.ts

# Generate updated Prisma client
echo "Generating updated Prisma client..."
npx prisma generate

echo "Migration complete! The Places schema has been updated and data migrated."
echo "Remember to update all code referencing the old schema." 