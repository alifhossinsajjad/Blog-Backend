import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../errors/AppError";
import catchAsync from "../utils/catchAsync";
import { auth as betterAuth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await betterAuth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // Role verification
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(session.user.role as string)
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have the required permissions",
      );
    }

    req.user = session.user as any;
    next();
  });
};
