import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { auth } from "../../middlewares/auth";

const router = Router();

router.get(
  "/",
  auth("ADMIN"),
  UserController.getAllUsers
);

router.patch(
  "/:id/status",
  auth("ADMIN"),
  validateRequest(UserValidation.updateUserStatusValidationSchema),
  UserController.updateUserStatus
);

export const UserRoutes = router;
