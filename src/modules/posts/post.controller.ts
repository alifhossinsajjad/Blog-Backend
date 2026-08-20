import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PostService } from "./post.service";
import { addImageJob } from "../../queues/image.queue";

type ID = {
  id: string;
};

const createPost = catchAsync(async (req: Request, res: Response) => {
  const localFilePath = req.file?.path;
  
  // is now saved locally, not on Cloudinary yet. The worker will handle it.

  // Inject the authenticated user's ID
  req.body.authorId = req.user?.id;

  const result = await PostService.createPost(req.body);

  if (localFilePath) {
    // Add job to BullMQ without awaiting, so it doesn't block the API response
    // (Upstash Redis network latency can take up to 1 second)
    addImageJob(result.id, localFilePath).catch(console.error);
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created successfully. Image is processing in the background.",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string | undefined,
    status: req.query.status as string | undefined,
    cursor: req.query.cursor as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
  };

  const result = await PostService.getAllPosts(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const result = await PostService.getPostById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post retrieved successfully",
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const localFilePath = req.file?.path;

  const result = await PostService.updatePost(id, req.body);

  if (localFilePath) {
    // Add job to BullMQ without awaiting
    addImageJob(result.id, localFilePath).catch(console.error);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post updated successfully. Image is processing if provided.",
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const result = await PostService.deletePost(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post deleted successfully",
    data: result,
  });
});

export const PostController = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
