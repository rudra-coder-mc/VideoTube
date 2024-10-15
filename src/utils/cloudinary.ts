import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import path from "path";

// Verify that required environment variables are present
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary configuration is missing");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary and removes the local file after uploading.
 * @param localFilePath The local file path to upload.
 * @returns The response from Cloudinary or null if the upload fails.
 */
const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
  if (!localFilePath || !fs.existsSync(localFilePath)) {
    console.error("File not found:", localFilePath);
    return null;
  }

  try {
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "uploads", // Optional: Set a specific folder for organizing uploads
    });

    console.log("File uploaded to Cloudinary:", response.secure_url);
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  } finally {
    // Delete the local file regardless of success or failure
    try {
      fs.unlinkSync(localFilePath);
      console.log("Temporary file deleted:", path.basename(localFilePath));
    } catch (deleteError) {
      console.error("Failed to delete temporary file:", deleteError);
    }
  }
};

const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    if (!publicId) {
      console.error("Public ID is required to delete an image.");
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok") {
      console.log(`Image with public ID: ${publicId} has been deleted.`);
      return true;
    } else {
      console.error(`Failed to delete image. Reason: ${result.result}`);
      return false;
    }
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
    return false;
  }
};


export { uploadOnCloudinary, deleteImageFromCloudinary };
