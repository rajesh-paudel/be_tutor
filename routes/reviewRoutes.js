import express from "express";
import {
  createReview,
  getTeacherReviews,
} from "../controllers/reviewController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch review repository for an individual instructor (Public Access)
router.get("/teacher/:teacherId", getTeacherReviews);

// 2. Publish a new evaluation metric item (Protected: Student Only)
router.post("/", verifyTokenAndRole(["student"]), createReview);

export default router;
