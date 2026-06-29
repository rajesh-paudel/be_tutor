import express from "express";

import { verifyTokenAndRole } from "../middleware/auth.js";
import {
  createBooking,
  updateBookingStatus,
  getUserBookings,
} from "../controller/bookingController.js";
const router = express.Router();

// 1. Fetch user-specific lists (Accessible by authenticated Students and Teachers)
router.get("/", verifyTokenAndRole(["student", "teacher"]), getUserBookings);

// 2. Issue a booking request reservation slot (Protected: Student Only)
router.post("/", verifyTokenAndRole(["student"]), createBooking);

// 3. Confirm/Deny slot requests (Protected: Teacher Only)
router.put("/:id/status", verifyTokenAndRole(["teacher"]), updateBookingStatus);

export default router;
