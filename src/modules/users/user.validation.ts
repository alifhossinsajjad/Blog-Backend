import { z } from "zod";

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "BLOCKED"]),
  }),
});

export const UserValidation = {
  updateUserStatusValidationSchema,
};
