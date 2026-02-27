import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      secure: true,
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Error in Uploading on Cloudinary", error);

    fs.unlinkSync(localFilePath); // Remove the temporary stored file
    return null;
  }
};

const deleteOnCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return;

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (response.result === "ok") return true;
    return false;
  } catch (error) {
    console.log("Error in Deleting On Cloudinary", error);
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
