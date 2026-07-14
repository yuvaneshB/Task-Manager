const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const logger = require('../utils/logger');

// Check if credentials exist
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary not configured. Falling back to local storage server uploads.');
}

const uploadToCloudinary = async (filePath, folder = 'avatars') => {
  try {
    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `enterprise_task_manager/${folder}`,
        resource_type: 'auto'
      });
      // Delete local temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    } else {
      // Local fallback: return local static relative URL
      const fileName = filePath.split(/[\\/]/).pop();
      return `/uploads/${fileName}`;
    }
  } catch (error) {
    logger.error('Error uploading file: %o', error);
    // Cleanup file in case of error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

module.exports = {
  uploadToCloudinary
};
