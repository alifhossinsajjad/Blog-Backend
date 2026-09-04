import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { PostRoutes } from "./modules/posts/post.router";
import { AuthRoutes } from "./modules/auth/auth.route";
import { CommentRoutes } from "./modules/comments/comment.router";
import { UserRoutes } from "./modules/users/user.router";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { stream } from "./utils/logger";

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  })
);

// HTTP Logging Middleware
app.use(morgan("combined", { stream }));

app.use(cors({
  origin: process.env.APP_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Add Origin header if missing (for API clients like Postman or Mobile Apps)
app.use((req, res, next) => {
  if (!req.headers.origin) {
    req.headers.origin = process.env.APP_ORIGIN ;
  }
  next();
});

//Auth Routes
app.use("/api/v1/auth", AuthRoutes);

// Better Auth Routes
app.all("/api/v1/auth/*splat", toNodeHandler(auth));

// Application Routes
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/posts", PostRoutes);
app.use("/api/v1/comments", CommentRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to my blog app");
});

// Global Error Handler
app.use(globalErrorHandler);

// Not Found Handler
app.use(notFound);

export default app;
