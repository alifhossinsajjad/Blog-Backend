import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CommentController } from "./comment.controller";
import { CommentValidation } from "./comment.validation";
import { auth } from "../../middlewares/auth";

const router = Router();

// Create a comment (protected)
router.post(
  "/",
  auth("USER", "ADMIN"),
  validateRequest(CommentValidation.createCommentValidationSchema),
  CommentController.createComment,
);

// Get all comments (usually filtered by postId via query params)
router.get("/", CommentController.getAllComments);

// Get replies for a specific comment
router.get("/:id/replies", CommentController.getReplies);

// Update a comment (protected, author or admin)
router.patch(
  "/:id",
  auth("USER", "ADMIN"),
  validateRequest(CommentValidation.updateCommentValidationSchema),
  CommentController.updateComment,
);

// Delete a comment (protected, author or admin)
router.delete("/:id", auth("USER", "ADMIN"), CommentController.deleteComment);

export const CommentRoutes = router;
