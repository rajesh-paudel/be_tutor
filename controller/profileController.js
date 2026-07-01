import TeacherProfile from "../models/TeacherProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import {
  deleteFromCloudinary,
  extractCloudinaryPublicId,
  uploadToCloudinary,
} from "../utils/cloudinary.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let profileData = null;

    if (role === "teacher") {
      profileData = await TeacherProfile.findOne({ userId }).populate(
        "userId",
        "name email profileImage",
      );
    } else if (role === "student") {
      profileData = await StudentProfile.findOne({ userId }).populate(
        "userId",
        "name email profileImage",
      );
    } else {
      // Admin layout fallback
      const adminData = await User.findById(userId).select("-passwordHash");
      return res.status(200).json({ success: true, role, data: adminData });
    }

    if (!profileData) {
      return res
        .status(404)
        .json({ success: false, error: "Profile specifics not found." });
    }

    return res.status(200).json({ success: true, role, data: profileData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select(
      "name profileImage role isSuspended",
    );

    if (!user || user.isSuspended) {
      return res
        .status(404)
        .json({ success: false, error: "Profile not found." });
    }

    let profileData = null;

    if (user.role === "teacher") {
      profileData = await TeacherProfile.findOne({ userId }).populate(
        "userId",
        "name profileImage role",
      );
    } else if (user.role === "student") {
      profileData = await StudentProfile.findOne({ userId }).populate(
        "userId",
        "name profileImage role",
      );
    } else {
      return res
        .status(404)
        .json({ success: false, error: "Profile not found." });
    }

    if (!profileData) {
      return res
        .status(404)
        .json({ success: false, error: "Profile not found." });
    }

    return res
      .status(200)
      .json({ success: true, role: user.role, data: profileData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      subjects,
      teachingLevels,
      hourlyRate,
      experienceYears,
      bio,
      weeklyAvailability,
    } = req.body;

    // Build update object dynamically
    const updateFields = {};
    if (subjects !== undefined) updateFields.subjects = subjects;
    if (teachingLevels !== undefined)
      updateFields.teachingLevels = teachingLevels;
    if (hourlyRate !== undefined) updateFields.hourlyRate = Number(hourlyRate);
    if (experienceYears !== undefined)
      updateFields.experienceYears = Number(experienceYears);
    if (bio !== undefined) updateFields.bio = bio;
    if (weeklyAvailability !== undefined)
      updateFields.weeklyAvailability = weeklyAvailability;

    const updatedProfile = await TeacherProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true },
    ).populate("userId", "name email profileImage");

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: "Teacher profile profile record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully.",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interests, academicLevel } = req.body;

    const updateFields = {};
    if (interests !== undefined) updateFields.interests = interests;
    if (academicLevel !== undefined) updateFields.academicLevel = academicLevel;

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true },
    ).populate("userId", "name email profileImage");

    if (!updatedProfile) {
      return res
        .status(404)
        .json({ success: false, error: "Student profile record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully.",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image file provided." });
    }

    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (currentUser.profileImage) {
      const publicId = extractCloudinaryPublicId(currentUser.profileImage);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    const uploadedImage = await uploadToCloudinary(req.file);

    currentUser.profileImage = uploadedImage.secure_url;
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully.",
      data: { profileImage: currentUser.profileImage },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    if (currentUser.profileImage) {
      const publicId = extractCloudinaryPublicId(currentUser.profileImage);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    currentUser.profileImage = "";
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: "Profile image removed successfully.",
      data: { profileImage: currentUser.profileImage },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
