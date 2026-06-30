import express from "express";

import { searchAndRecommendTutors } from "../controller/tutorController.js";
const router = express.Router();

// Public tutor discovery uses the recommendation engine without requiring login.
router.get("/search", searchAndRecommendTutors);

export default router;
