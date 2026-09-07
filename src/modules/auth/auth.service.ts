import { cloudinaryUpload } from "../../utils/cloudinary";
import { auth } from "../../lib/auth";
import fs from "fs";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

export const registerUserService = async (userData: any, file: Express.Multer.File | undefined, headers: any) => {
  const { name, email, password, phone, address } = userData;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new AppError(httpStatus.BAD_REQUEST, "User with this email already exists");
  }

  let imageUrl = undefined;

  // 2. Upload image to Cloudinary if a file was provided
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
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
    }
  }

  // 3. Convert Express headers to Web Standard Headers for Better Auth
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      webHeaders.set(key, Array.isArray(value) ? value.join(",") : value as string);
    }
  }

  // 4. Call Better Auth's programmatic API to sign up
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      image: imageUrl,
      phone,
      address,
      callbackURL: "http://localhost:3000/auth/login", // Redirect here after verification
    },
    headers: webHeaders,
    asResponse: true,
  });

  if (!response.ok) {
    let errMessage = "Failed to register user";
    try {
      const errData = await response.json();
      errMessage = errData?.message || errMessage;
    } catch (e) {
      errMessage = await response.text();
    }
    throw new AppError(httpStatus.BAD_REQUEST, errMessage);
  }

  const data = await response.json();
  return { responseHeaders: response.headers, data };
};
