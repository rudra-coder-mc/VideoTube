import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config()

// console.log(
//   process.env.PORT,
//   process.env.CLOUDINARY_CLOUD_NAME,
//   process.env.CLOUDINARY_API_KEY,
//   process.env.CLOUDINARY_API_SECRET,
// )

// Verify that required environment variables are present
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.log('Cloudinary configuration is missing')
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Uploads a file to Cloudinary and removes the local file after uploading.
 * @param localFilePath The local file path to upload.
 * @returns The response from Cloudinary or null if the upload fails.
 */
const uploadOnCloudinary = async (
  localFilePath: string,
): Promise<UploadApiResponse | null> => {
  if (!localFilePath || !fs.existsSync(localFilePath)) {
    console.error('File not found:', localFilePath)
    return null
  }

  try {
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'uploads', // Optional: Set a specific folder for organizing uploads
    })

    console.log('File uploaded to Cloudinary:', response.secure_url)
    return response
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    return null
  } finally {
    // Delete the local file regardless of success or failure
    try {
      fs.unlinkSync(localFilePath)
      console.log('Temporary file deleted:', path.basename(localFilePath))
    } catch (deleteError) {
      console.error('Failed to delete temporary file:', deleteError)
    }
  }
}

const deleteImageFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  try {
    if (!publicId) {
      console.error('Public ID is required to delete an image.')
      return false
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })

    if (result.result === 'ok') {
      console.log(`Image with public ID: ${publicId} has been deleted.`)
      return true
    } else {
      console.error(`Failed to delete image. Reason: ${result.result}`)
      return false
    }
  } catch (error) {
    console.error('Cloudinary deletion failed:', error)
    return false
  }
}

// Helper function to extract the public ID from the Cloudinary URL
const extractPublicId = (url: string): string => {
  // Split the URL to isolate the part after "/upload/"
  const parts = url.split('/upload/')
  if (parts.length < 2) {
    throw new Error('Invalid Cloudinary URL format')
  }

  // Get the public ID with the potential folder structure and remove the file extension
  const publicIdWithExtension = parts[1].split('.')[0] // Removes the file extension
  return publicIdWithExtension // e.g., "uploads/rphkdcmamnkfhle6jp0u"
}

export { uploadOnCloudinary, deleteImageFromCloudinary, extractPublicId }
