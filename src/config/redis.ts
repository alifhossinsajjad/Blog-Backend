import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("REDIS_URL is missing in .env file!");
}

export const redisConnection = new Redis(redisUrl as string, {
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false
  }
});

redisConnection.on('connect', () => {
  console.log('Redis connected successfully!');
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
