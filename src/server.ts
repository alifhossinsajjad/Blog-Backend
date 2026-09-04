import app from "./app";
import { prisma } from "./lib/prisma";
import "./workers/image.worker";
import { logger } from "./utils/logger";
import { Server } from "http";

const PORT = process.env.PORT || 5000;
let server: Server;

async function main() {
  try {
    await prisma.$connect();
    logger.info("Database Connected Successfully");

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

// Graceful Shutdown Handlers
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection! Shutting down...", err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception! Shutting down...", err);
  process.exit(1);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");
      await prisma.$disconnect();
      logger.info("Database connection closed.");
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
