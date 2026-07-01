import express from "express";

import {
  getMyProfile,
  getPublicProfile,
  removeProfileImage,
  updateProfileImage,
  updateStudentProfile,
  updateTeacherProfile,
} from "../controller/profileController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// 1. Fetch current profile layout (Accessible by any logged-in user)
router.get("/me", verifyTokenAndRole([]), getMyProfile);

// 2. Fetch public profile layout by user ID
router.get("/:id", getPublicProfile);

// 3. Update Teacher-specific details (Protected: Teacher role required)
router.put("/teacher", verifyTokenAndRole(["teacher"]), updateTeacherProfile);

// 4. Update Student-specific details (Protected: Student role required)
router.put("/student", verifyTokenAndRole(["student"]), updateStudentProfile);

// 5. Upload/remove profile image (Protected: any logged-in user)
router.post(
  "/image",
  verifyTokenAndRole([]),
  upload.single("profileImage"),
  updateProfileImage,
);
router.delete("/image", verifyTokenAndRole([]), removeProfileImage);

export default router;
