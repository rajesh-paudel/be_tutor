import express from "express";
import { searchAndRecommendTutors } from "../controllers/tutorController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// Route configuration mapping. Pass empty array to allow any logged in student/user to query
router.get("/search", verifyTokenAndRole([]), searchAndRecommendTutors);

export default router;
