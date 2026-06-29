import express from "express";

import {
  getMyProfile,
  updateStudentProfile,
  updateTeacherProfile,
} from "../controller/profileController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch current profile layout (Accessible by any logged-in user)
router.get("/me", verifyTokenAndRole([]), getMyProfile);

// 2. Update Teacher-specific details (Protected: Teacher role required)
router.put("/teacher", verifyTokenAndRole(["teacher"]), updateTeacherProfile);

// 3. Update Student-specific details (Protected: Student role required)
router.put("/student", verifyTokenAndRole(["student"]), updateStudentProfile);

export default router;
