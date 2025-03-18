"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
/**
 * Upload a file to Cloudinary
 * @param file The file to upload
 * @param folder The folder to upload to
 * @returns The upload result
 */
async function uploadToCloudinary(file, folder = 'community-site') {
    try {
        const result = await cloudinary_1.v2.uploader.upload(file, {
            folder,
            resource_type: 'auto', // Automatically detect if it's an image or video
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            success: true
        };
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return {
            url: null,
            publicId: null,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Delete a file from Cloudinary
 * @param publicId The public ID of the file to delete
 * @returns The delete result
 */
async function deleteFromCloudinary(publicId) {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return {
            success: result.result === 'ok',
            result
        };
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
