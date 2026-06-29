import express from "express";
import {
  uploadResource,
  getResources,
} from "../controllers/resourceController.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

// 1. Fetch available material items (Any authenticated student or teacher can read notes)
router.get("/", verifyTokenAndRole([]), getResources);

// 2. Publish new material and call summary generator pipeline (Protected: Teachers Only)
router.post("/", verifyTokenAndRole(["teacher"]), uploadResource);

export default router;
