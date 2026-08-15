import { Post } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

// Helper to generate a slug from title
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const createPost = async (payload: any): Promise<Post> => {
  // Generate a unique slug
  let slug = generateSlug(payload.title);

  // Basic logic to ensure slug uniqueness (could be improved in a real app)
  const existingPost = await prisma.post.findUnique({ where: { slug } });
  if (existingPost) {
    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
  }

  const result = await prisma.post.create({
    data: {
      ...payload,
      slug,
    },
  });
  return result;
};

const getAllPosts = async (): Promise<Post[]> => {
  const result = await prisma.post.findMany({
    include: {
      author: true, // You might want to select specific fields here to avoid sending password hashes later
    },
  });
  return result;
};

const getPostById = async (id: string): Promise<Post | null> => {
  const result = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });
  return result;
};

const updatePost = async (
  id: string,
  payload: Partial<Post>,
): Promise<Post> => {
  const result = await prisma.post.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deletePost = async (id: string): Promise<Post> => {
  const result = await prisma.post.delete({
    where: { id },
  });
  return result;
};

export const PostService = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
