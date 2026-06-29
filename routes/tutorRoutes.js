import express from "express";

import { verifyTokenAndRole } from "../middleware/auth.js";
import { searchAndRecommendTutors } from "../controller/tutorController.js";
const router = express.Router();

// Route configuration mapping. Pass empty array to allow any logged in student/user to query
router.get("/search", verifyTokenAndRole([]), searchAndRecommendTutors);

export default router;
