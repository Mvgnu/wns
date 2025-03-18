#!/bin/bash

# Script to replace Cloudinary image uploaders with MediaUploader

echo "🔍 Finding files that use Cloudinary..."

# Find all files that import CldUploadWidget
FILES_WITH_CLOUDINARY=$(grep -l "import.*CldUploadWidget" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -r ./app ./components)

if [ -z "$FILES_WITH_CLOUDINARY" ]; then
  echo "✅ No files found using Cloudinary image uploaders."
  exit 0
fi

echo "🔄 Found files using Cloudinary:"
echo "$FILES_WITH_CLOUDINARY"
echo ""

echo "⚠️ Manual review required!"
echo "The ImageUploader component has been updated to use MediaUploader."
echo "Please review the following files and update them to use the new ImageUploader component:"
echo "$FILES_WITH_CLOUDINARY"
echo ""
echo "Steps to update:"
echo "1. Replace 'import { CldUploadWidget } from \"next-cloudinary\";' with appropriate imports"
echo "2. Replace Cloudinary upload widgets with MediaUploader or ImageUploader"
echo "3. Update any Cloudinary-specific code to use the new upload API"
echo ""
echo "For reference, the new ImageUploader component is located at:"
echo "  components/ui/ImageUploader.tsx"
echo ""
echo "The MediaUploader component is located at:"
echo "  components/ui/MediaUploader.tsx"
echo ""
echo "The upload API endpoint is located at:"
echo "  app/api/upload/route.ts" 