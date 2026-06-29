import express from "express";
import { solveHomeworkDoubt } from "../controllers/aiController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// Route mapping configuration protected for Student users
router.post(
  "/homework-helper",
  verifyTokenAndRole(["student"]),
  solveHomeworkDoubt,
);

export default router;
