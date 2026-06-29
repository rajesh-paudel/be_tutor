import express from "express";

import { verifyTokenAndRole } from "../middleware/auth.js";
import { solveHomeworkDoubt } from "../controller/aiController.js";
const router = express.Router();

// Route mapping configuration protected for Student users
router.post(
  "/homework-helper",
  verifyTokenAndRole(["student"]),
  solveHomeworkDoubt,
);

export default router;
