import express from "express";

import {
  getPlatformStats,
  verifyTeacherProfile,
  toggleUserSuspension,
} from "../controller/adminController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// Apply administrative structural safeguards across all route variations down the execution ladder
const adminGuard = verifyTokenAndRole(["admin"]);

// 1. Grab summary metrics numbers for UI grid charts map visualization
router.get("/dashboard-stats", adminGuard, getPlatformStats);

// 2. Perform document authorization audit verification updates
router.put("/teachers/:id/verify", adminGuard, verifyTeacherProfile);

// 3. Suspend/reinstate users
router.put("/users/:id/suspend", adminGuard, toggleUserSuspension);

export default router;
