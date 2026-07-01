import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "tutor-app",
        resource_type: "image",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
  });
};

export const extractCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};
