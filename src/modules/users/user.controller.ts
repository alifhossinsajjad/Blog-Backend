import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

type ID = {
  id: string;
};

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string | undefined,
    status: req.query.status as string | undefined,
    role: req.query.role as string | undefined,
    cursor: req.query.cursor as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await UserService.getAllUsers(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as ID;
  const { status } = req.body;

  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User status updated to ${status} successfully`,
    data: result,
  });
});

export const UserController = {
  getAllUsers,
  updateUserStatus,
};
