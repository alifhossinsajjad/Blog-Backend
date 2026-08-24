import { Post } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

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

export interface IPostFilters {
  searchTerm?: string | undefined;
  status?: string | undefined;
  authorId?: string | undefined;
  cursor?: string | undefined;
  limit?: number;
}

const getAllPosts = async (filters: IPostFilters) => {
  const { searchTerm, status, authorId, cursor, limit = 10 } = filters;
  const whereCondition: any = {};

  if (searchTerm) {
    whereCondition.OR = [
      { title: { contains: searchTerm, mode: "insensitive" as const } },
      { content: { contains: searchTerm, mode: "insensitive" as const } },
    ];
  }

  if (status) {
    whereCondition.status = status;
  }

  if (authorId) {
    whereCondition.authorId = authorId;
  }

  const result = await prisma.post.findMany({
    where: whereCondition,
    take: limit + 1, // Fetch an extra record to check if there is a next page
    ...(cursor && { cursor: { id: cursor } }),
    skip: cursor ? 1 : 0, // Skip the cursor post itself
    orderBy: {
      createdAt: "desc", // Newest posts first
    },
    include: {
      _count: {
        select: { comments: true }
      },
      author: true, // You might want to select specific fields here to avoid sending password hashes later
      comments: {
        where: { parentId: null },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop(); // Remove the extra record from results
    nextCursor = nextItem!.id;
  }

  return {
    data: result,
    meta: {
      nextCursor,
    },
  };
};

const getPostById = async (id: string): Promise<Post> => {
  try {
    const result = await prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      include: {
        _count: {
          select: { comments: true }
        },
        author: true,
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, image: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return result;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new AppError(httpStatus.NOT_FOUND, "Post not found!");
    }
    throw error;
  }
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
