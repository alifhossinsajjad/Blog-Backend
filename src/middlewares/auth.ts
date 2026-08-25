import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../errors/AppError";
import catchAsync from "../utils/catchAsync";
import { auth as betterAuth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../lib/prisma";

export const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const session = await betterAuth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // Double check user status in the database to instantly reject blocked users
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { status: true },
    });

    if (!dbUser || dbUser.status === "BLOCKED") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been deactivated. Please contact support.",
      );
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
