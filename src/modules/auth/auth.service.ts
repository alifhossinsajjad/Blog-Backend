import { cloudinaryUpload } from "../../utils/cloudinary";
import { auth } from "../../lib/auth";
import fs from "fs";

export const registerUserService = async (userData: any, file: Express.Multer.File | undefined, headers: any) => {
  const { name, email, password, phone, address } = userData;
  let imageUrl = undefined;

  // 1. Upload image to Cloudinary if a file was provided
  if (file) {
    try {
      const uploadResult = await cloudinaryUpload.uploader.upload(file.path, {
        folder: "blog_users",
      });
      imageUrl = uploadResult.secure_url;

      // Remove file from local disk after upload
      fs.unlinkSync(file.path);
    } catch (error) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error("Failed to upload image");
    }
  }

  // 2. Convert Express headers to Web Standard Headers for Better Auth
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      webHeaders.set(key, Array.isArray(value) ? value.join(",") : value as string);
    }
  }

  // 3. Call Better Auth's programmatic API to sign up
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      image: imageUrl,
      phone,
      address,
    },
    headers: webHeaders,
    asResponse: true,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to register user");
  }

  const data = await response.json();
  return { responseHeaders: response.headers, data };
};
