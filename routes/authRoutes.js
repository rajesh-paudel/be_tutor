import express from "express";
import { registerUser, loginUser } from "../controller/authController.js";

const router = express.Router();

// Route mapping for Authentication operations
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
