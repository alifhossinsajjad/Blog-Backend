import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { registerUserService } from "./auth.service";

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  try {
    let userData = req.body;
    
    // Check if the frontend sent the data as a single JSON string under the 'data' key
    if (req.body.data) {
      userData = JSON.parse(req.body.data);
    }

    // 1. Send data to service
    const { responseHeaders, data } = await registerUserService(
      userData,
      req.file,
      req.headers
    );

    // 2. Set Cookies/Headers returned from Better Auth
    responseHeaders.forEach((value: string, key: string) => {
      res.append(key, value);
    });

    // 3. Send final response to client
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data,
    });
  } catch (error: any) {
    throw new Error(error.message || "Failed to register user");
  }
});
