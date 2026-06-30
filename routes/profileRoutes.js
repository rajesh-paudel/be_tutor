import express from "express";

import {
  getMyProfile,
  getPublicProfile,
  updateStudentProfile,
  updateTeacherProfile,
} from "../controller/profileController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch current profile layout (Accessible by any logged-in user)
router.get("/me", verifyTokenAndRole([]), getMyProfile);

// 2. Fetch public profile layout by user ID
router.get("/:id", getPublicProfile);

// 3. Update Teacher-specific details (Protected: Teacher role required)
router.put("/teacher", verifyTokenAndRole(["teacher"]), updateTeacherProfile);

// 4. Update Student-specific details (Protected: Student role required)
router.put("/student", verifyTokenAndRole(["student"]), updateStudentProfile);

export default router;
