import express from "express";

import {
  createAssignment,
  submitAssignment,
  getAssignments,
  gradeSubmission,
} from "../controller/assignmentController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch available listings context (Students and Teachers)
router.get("/", verifyTokenAndRole(["student", "teacher"]), getAssignments);

// 2. Publish new assignment (Protected: Teacher Only)
router.post("/", verifyTokenAndRole(["teacher"]), createAssignment);

// 3. Post solution file link attachment (Protected: Student Only)
router.post("/:id/submit", verifyTokenAndRole(["student"]), submitAssignment);

// 4. Return evaluation metric scores (Protected: Teacher Only)
router.put("/:id/grade", verifyTokenAndRole(["teacher"]), gradeSubmission);

export default router;
