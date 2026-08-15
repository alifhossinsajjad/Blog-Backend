import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { PostRoutes } from "./modules/posts/post.router";

const app: Application = express();

app.use(express.json());
app.use(cors());

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
