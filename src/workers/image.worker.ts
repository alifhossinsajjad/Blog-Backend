import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { IMAGE_PROCESSING_QUEUE } from "../queues/image.queue";
import sharp from "sharp";
import { cloudinaryUpload } from "../utils/cloudinary";
import { prisma } from "../lib/prisma";
import fs from "fs";

export const imageWorker = new Worker(
  IMAGE_PROCESSING_QUEUE,
  async (job) => {
    const { postId, filePath } = job.data;

    try {
      console.log(`[Job ${job.id}] Processing image for post ${postId}`);

      // 1. Optimize image using sharp
      const optimizedBuffer = await sharp(filePath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Upload to Cloudinary using upload_stream
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinaryUpload.uploader.upload_stream(
          { folder: "blog-app-thumbnails", format: "webp" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        // Write the optimized buffer to the stream
        uploadStream.end(optimizedBuffer);
      });

      const thumbnailUrl = (cloudinaryResult as any).secure_url;

      // 3. Update the post in database
      await prisma.post.update({
        where: { id: postId },
        data: { thumbnail: thumbnailUrl },
      });

      // 4. Delete the local temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(
        `[Job ${job.id}] Successfully processed and uploaded image for post ${postId}`,
      );
      return thumbnailUrl;
    } catch (error) {
      console.error(
        `[Job ${job.id}] Error processing image for post ${postId}:`,
        error,
      );
      // Ensure we delete the local file even if there is an error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error; // Let BullMQ handle the retry
    }
  },
  {
    connection: redisConnection,
  },
);

imageWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

imageWorker.on("failed", (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
