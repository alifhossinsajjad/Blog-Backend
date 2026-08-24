import { Comment, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createComment = async (
  authorId: string,
  payload: { content: string; postId: string; parentId?: string },
): Promise<Comment> => {
  // Check if post exists
  const postExists = await prisma.post.findUnique({
    where: { id: payload.postId },
  });

  if (!postExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found!");
  }

  // Check if parent comment exists if parentId is provided
  if (payload.parentId) {
    const parentCommentExists = await prisma.comment.findUnique({
      where: { id: payload.parentId },
    });
    if (!parentCommentExists) {
      throw new AppError(httpStatus.NOT_FOUND, "Parent comment not found!");
    }
  }

  const result = await prisma.comment.create({
    data: {
      content: payload.content,
      postId: payload.postId,
      parentId: payload.parentId || null,
      authorId,
    },
  });

  return result;
};

export interface ICommentFilters {
  postId?: string | undefined;
  authorId?: string | undefined;
  limit?: number;
  cursor?: string | undefined;
}

const getAllComments = async (filters: ICommentFilters) => {
  const { postId, authorId, limit = 20, cursor } = filters;

  const whereCondition: Prisma.CommentWhereInput = {};

  if (postId) {
    whereCondition.postId = postId;
  }
  
  if (authorId) {
    whereCondition.authorId = authorId;
  }
  
  // By default, if filtering by post, get only top-level comments.
  // If fetching by authorId, they probably want to see ALL their comments including replies.
  if (!authorId) {
    whereCondition.parentId = null;
  }

  const result = await prisma.comment.findMany({
    where: whereCondition,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor } }),
    skip: cursor ? 1 : 0,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      // Including immediate replies count or replies could be heavy, so we can just include the replies array or a count.
      _count: {
        select: { replies: true },
      },
    },
  });

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop();
    nextCursor = nextItem!.id;
  }

  return {
    data: result,
    meta: {
      nextCursor,
    },
  };
};

const getRepliesByCommentId = async (commentId: string, limit: number = 20, cursor?: string) => {
  const result = await prisma.comment.findMany({
    where: { parentId: commentId },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor } }),
    skip: cursor ? 1 : 0,
    orderBy: {
      createdAt: "asc", // Replies usually go oldest first
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop();
    nextCursor = nextItem!.id;
  }

  return {
    data: result,
    meta: {
      nextCursor,
    },
  };
};

const updateComment = async (
  id: string,
  authorId: string,
  userRole: string,
  payload: Partial<Comment>,
): Promise<Comment> => {
  const existingComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!existingComment) {
    throw new AppError(httpStatus.NOT_FOUND, "Comment not found!");
  }

  // Only the author can update their own comment, or an ADMIN can update it
  if (existingComment.authorId !== authorId && userRole !== "ADMIN") {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to update this comment");
  }

  // Only allow updating content in this route
  const result = await prisma.comment.update({
    where: { id },
    data: {
      ...(payload.content !== undefined && { content: payload.content }),
    },
  });

  return result;
};

const moderateComment = async (
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
): Promise<Comment> => {
  const existingComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!existingComment) {
    throw new AppError(httpStatus.NOT_FOUND, "Comment not found!");
  }

  // Prevent redundant database updates if the status is already the same
  if (existingComment.status === status) {
    throw new AppError(httpStatus.BAD_REQUEST, `Comment is already ${status}`);
  }

  // Use a transaction so both the comment and its replies are updated together
  const result = await prisma.$transaction(async (tx) => {
    const updatedComment = await tx.comment.update({
      where: { id },
      data: { status },
    });

    // Apply the status to all replies as well
    await tx.comment.updateMany({
      where: { parentId: id },
      data: { status },
    });

    return updatedComment;
  });

  return result;
};

const deleteComment = async (id: string, authorId: string, userRole: string): Promise<Comment> => {
  const existingComment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!existingComment) {
    throw new AppError(httpStatus.NOT_FOUND, "Comment not found!");
  }

  if (existingComment.authorId !== authorId && userRole !== "ADMIN") {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to delete this comment");
  }

  const result = await prisma.comment.delete({
    where: { id },
  });

  return result;
};

export const CommentService = {
  createComment,
  getAllComments,
  getRepliesByCommentId,
  updateComment,
  moderateComment,
  deleteComment,
};
