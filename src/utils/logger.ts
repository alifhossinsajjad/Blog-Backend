import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Stream for Morgan integration
export const stream = {
  write: (message: string) => {
    // Morgan outputs with a newline, so we trim it
    logger.info(message.trim());
  },
};
