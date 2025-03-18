#!/bin/bash

# Install required dependencies
echo "Installing dependencies..."
npm install nodemailer googleapis geolib

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Dependencies updated successfully!" 