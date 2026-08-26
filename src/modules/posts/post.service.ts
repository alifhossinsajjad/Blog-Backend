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

  // Always hide blocked users' posts, even from themselves in /my-posts
  whereCondition.author = {
    status: "ACTIVE",
  };

  const [result, total] = await Promise.all([
    prisma.post.findMany({
      where: whereCondition,
      take: limit + 1, // Fetch an extra record to check if there is a next page
      ...(cursor && { cursor: { id: cursor } }),
      skip: cursor ? 1 : 0, // Skip the cursor post itself
      orderBy: {
        createdAt: "desc", // Newest posts first
      },
      include: {
        _count: {
          select: { comments: true },
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
    }),
    prisma.post.count({
      where: whereCondition,
    }),
  ]);

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop(); // Remove the extra record from results
    nextCursor = nextItem!.id;
  }

  return {
    data: result,
    meta: {
      nextCursor,
      total,
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
          select: { comments: true },
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
  authorId: string,
  userRole: string,
  payload: Partial<Post>,
): Promise<Post> => {
  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found!");
  }

  if (existingPost.authorId !== authorId && userRole !== "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this post",
    );
  }

  const result = await prisma.post.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deletePost = async (
  id: string,
  authorId: string,
  userRole: string,
): Promise<Post> => {
  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found!");
  }

  if (existingPost.authorId !== authorId && userRole !== "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this post",
    );
  }

  const result = await prisma.post.delete({
    where: { id },
  });
  return result;
};

const getStats = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // 🚀 Senior Engineer Approach: Execute all independent database queries concurrently using Promise.all
  // This drastically reduces the API response time compared to awaiting them sequentially.
  const [
    totalPosts,
    totalUsers,
    totalComments,
    viewsAggregation,
    recentPosts,
    userStatusCounts,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.post.aggregate({
      _sum: { viewCount: true },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({
      by: ['status'],
      _count: { status: true },
    })
  ]);

  const totalViews = viewsAggregation._sum.viewCount || 0;

  // Transform user status counts into a readable format (e.g., { ACTIVE: 10, BLOCKED: 2 })
  const userStats = userStatusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  // Group posts by month for the line/bar chart
  const postsByMonth = recentPosts.reduce((acc: Record<string, number>, post) => {
    const month = post.createdAt.toLocaleString("default", { month: "short", year: "numeric" });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const graphData = Object.keys(postsByMonth).map((month) => ({
    name: month,
    posts: postsByMonth[month],
  }));

  return {
    overview: {
      totalPosts,
      totalUsers,
      totalComments,
      totalViews,
      activeUsers: userStats["ACTIVE"] || 0,
      blockedUsers: userStats["BLOCKED"] || 0,
    },
    graphData,
  };
};

export const PostService = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getStats,
};
