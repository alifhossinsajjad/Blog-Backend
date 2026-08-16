import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const IMAGE_PROCESSING_QUEUE = 'image-processing-queue';

export const imageQueue = new Queue(IMAGE_PROCESSING_QUEUE, {
  connection: redisConnection,
});

export const addImageJob = async (postId: string, filePath: string) => {
  await imageQueue.add('optimize-and-upload', {
    postId,
    filePath,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};
