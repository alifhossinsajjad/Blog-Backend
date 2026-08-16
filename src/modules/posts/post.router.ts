import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";
import { upload } from "../../utils/multer";

const router = Router();

router.post(
  "/",
  upload.single("file"),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(PostValidation.createPostValidationSchema),
  PostController.createPost,
);

router.get("/", PostController.getAllPosts);

router.get("/:id", PostController.getPostById);

router.patch(
  "/:id",
  upload.single("file"),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(PostValidation.updatePostValidationSchema),
  PostController.updatePost,
);

router.delete("/:id", PostController.deletePost);

export const PostRoutes = router;
