import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import dbConnect from "./lib/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
dbConnect();

// Global Middleware
app.use(
  cors({
    origin: "https://fe-tutor-rho.vercel.app",
    credentials: true,
  }),
);
app.use(express.json());

// Bind API Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
// Base Route Health Check
app.get("/", (req, res) => {
  res.send("Tutor Application API is up and running.");
});

app.listen(PORT, () => {
  console.log(`Server running smoothly on port ${PORT}`);
});
