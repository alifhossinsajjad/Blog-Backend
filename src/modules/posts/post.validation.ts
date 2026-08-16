import { z } from 'zod';

const createPostValidationSchema = z.object({
  body: z.object({
    title: z.string({
      message: 'Title is required',
    }).max(255, 'Title must be less than 255 characters'),
    content: z.string({
      message: 'Content is required',
    }),
    authorId: z.string({
      message: 'Author ID is required',
    }),
    thumbnail: z.string().optional(),
    isFeatured: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    tags: z.array(z.string(), {
      message: "Tags are required",
    }),
  }),
});

const updatePostValidationSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    content: z.string().optional(),
    thumbnail: z.string().optional(),
    isFeatured: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const PostValidation = {
  createPostValidationSchema,
  updatePostValidationSchema,
};
