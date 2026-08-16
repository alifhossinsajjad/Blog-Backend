import express from "express";
import { registerUser } from "./auth.controller";
import { upload } from "../../utils/multer";

const router = express.Router();

// Custom registration route supporting multipart/form-data for image uploads
router.post("/register", upload.single("image"), registerUser);

export const AuthRoutes = router;
