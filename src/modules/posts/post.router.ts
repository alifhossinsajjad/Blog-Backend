import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = Router();

router.post(
  "/",
  validateRequest(PostValidation.createPostValidationSchema),
  PostController.createPost,
);

router.get("/", PostController.getAllPosts);

router.get("/:id", PostController.getPostById);

router.patch(
  "/:id",
  validateRequest(PostValidation.updatePostValidationSchema),
  PostController.updatePost,
);

router.delete("/:id", PostController.deletePost);

export const PostRoutes = router;
