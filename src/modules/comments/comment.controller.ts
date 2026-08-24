import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CommentService } from "./comment.service";

type ID = {
  id: string;
};

const createComment = catchAsync(async (req: Request, res: Response) => {
  const authorId = req.user?.id;
  const result = await CommentService.createComment(authorId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment created successfully",
    data: result,
  });
});

const getAllComments = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    postId: req.query.postId as string | undefined,
    authorId: req.query.authorId as string | undefined,
    cursor: req.query.cursor as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await CommentService.getAllComments(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getReplies = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const cursor = req.query.cursor as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const result = await CommentService.getRepliesByCommentId(id, limit, cursor);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Replies retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const authorId = req.user?.id;
  const userRole = req.user?.role;

  const result = await CommentService.updateComment(
    id,
    authorId,
    userRole,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});

const moderateComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const { status } = req.body;

  const result = await CommentService.moderateComment(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Comment status updated to ${status}`,
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const authorId = req.user?.id;
  const userRole = req.user?.role;

  const result = await CommentService.deleteComment(id, authorId, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentController = {
  createComment,
  getAllComments,
  getReplies,
  updateComment,
  moderateComment,
  deleteComment,
};
