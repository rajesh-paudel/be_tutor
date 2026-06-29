import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StudentProfile from "../models/StudentProfile.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Data Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing mandatory registration fields.",
      });
    }

    // 2. Identity Collision Check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "An account with this email address already exists.",
      });
    }

    // 3. Password Cryptography Hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Persistence Layout Generation
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    // 5. Dependent Profile Creation based on Role Type
    if (role === "teacher") {
      await TeacherProfile.create({
        userId: newUser._id,
        subjects: [],
        hourlyRate: 0,
        experienceYears: 0,
        bio: "Please update your professional bio details.",
      });
    } else if (role === "student") {
      await StudentProfile.create({
        userId: newUser._id,
        interests: [],
        academicLevel: "",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Verification
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both email and password.",
      });
    }

    // 2. Target Profile Query
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid authentication credentials." });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Account is suspended.",
      });
    }

    // 3. Cryptographic Verification Matching
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid authentication credentials." });
    }

    // 4. Issue Signature (Token Assignment Expires in 24 Hours)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
