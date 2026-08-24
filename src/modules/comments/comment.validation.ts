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
<<<<<<< HEAD
  }),
});

const moderateCommentValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
      message: "Status is required for moderation",
    }),
=======
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
>>>>>>> 36b591422a1c82389512473556551c0e8992caa5
  }),
});

export const CommentValidation = {
  createCommentValidationSchema,
  updateCommentValidationSchema,
<<<<<<< HEAD
  moderateCommentValidationSchema,
=======
>>>>>>> 36b591422a1c82389512473556551c0e8992caa5
};
