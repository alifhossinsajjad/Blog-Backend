import { User, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

export interface IUserFilters {
  searchTerm?: string | undefined;
  status?: string | undefined;
  role?: string | undefined;
  limit?: number;
  cursor?: string | undefined;
}

const getAllUsers = async (filters: IUserFilters) => {
  const { searchTerm, status, role, limit = 20, cursor } = filters;
  const whereCondition: Prisma.UserWhereInput = {};

  if (searchTerm) {
    whereCondition.OR = [
      { name: { contains: searchTerm, mode: "insensitive" as const } },
      { email: { contains: searchTerm, mode: "insensitive" as const } },
    ];
  }

  if (status) {
    whereCondition.status = status as any;
  }
  
  if (role) {
    whereCondition.role = role as any;
  }

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor } }),
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { posts: true, comments: true }
        }
      }
    }),
    prisma.user.count({ where: whereCondition }),
  ]);

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop();
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

const updateUserStatus = async (
  id: string,
  status: "ACTIVE" | "BLOCKED",
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (existingUser.role === "ADMIN") {
    throw new AppError(httpStatus.FORBIDDEN, "Cannot block an admin user");
  }

  if (existingUser.status === status) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is already ${status}`);
  }

  const result = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true
    }
  });

  return result;
};

export const UserService = {
  getAllUsers,
  updateUserStatus,
};
