import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { PostRoutes } from "./modules/posts/post.router";
import { AuthRoutes } from "./modules/auth/auth.route";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app: Application = express();

app.use(express.json());
app.use(cors());

//Auth Routes
app.use("/api/v1/auth", AuthRoutes);

// Better Auth Routes
app.use("/api/v1/auth/*splat", toNodeHandler(auth));

// Application Routes
app.use("/api/v1/posts", PostRoutes); 

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to my blog app");
});

// Global Error Handler
app.use(globalErrorHandler);

// Not Found Handler
app.use(notFound);

export default app;
