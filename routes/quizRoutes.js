import express from "express";

import {
  createQuiz,
  submitQuizAttempt,
  getQuizzes,
} from "../controller/quizController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch complete quiz inventory list (Students and Teachers)
router.get("/", verifyTokenAndRole(["student", "teacher"]), getQuizzes);

// 2. Draft evaluation criteria (Protected: Teacher Only)
router.post("/", verifyTokenAndRole(["teacher"]), createQuiz);

// 3. Process answer selection array (Protected: Student Only)
router.post("/:id/submit", verifyTokenAndRole(["student"]), submitQuizAttempt);

export default router;
