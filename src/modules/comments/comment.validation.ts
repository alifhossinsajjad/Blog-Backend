import { z } from "zod";

const createCommentValidationSchema = z.object({
  body: z.object({
    content: z.string({
      message: "Content is required",
    }),
    postId: z.string({
      message: "Post ID is required",
    }),
    parentId: z.string().optional(),
  }),
});

const updateCommentValidationSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  }),
});

export const CommentValidation = {
  createCommentValidationSchema,
  updateCommentValidationSchema,
};
