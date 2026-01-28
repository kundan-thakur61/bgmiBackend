const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image helper
const uploadImage = async (file, folder = 'battlezone') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Delete image helper
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
};

// Upload screenshot with metadata extraction
const uploadScreenshot = async (file, matchId, userId) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `battlezone/screenshots/${matchId}`,
      resource_type: 'image',
      context: {
        userId,
        matchId,
        uploadedAt: new Date().toISOString()
      },
      transformation: [
        { quality: 'auto:best' }
      ]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error(`Screenshot upload failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  uploadScreenshot
};
