import TeacherProfile from "../models/TeacherProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";

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

export const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { subjects, hourlyRate, experienceYears, bio, weeklyAvailability } =
      req.body;

    // Build update object dynamically
    const updateFields = {};
    if (subjects !== undefined) updateFields.subjects = subjects;
    if (hourlyRate !== undefined) updateFields.hourlyRate = Number(hourlyRate);
    if (experienceYears !== undefined)
      updateFields.experienceYears = Number(experienceYears);
    if (bio !== undefined) updateFields.bio = bio;
    if (weeklyAvailability !== undefined)
      updateFields.weeklyAvailability = weeklyAvailability;

    const updatedProfile = await TeacherProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true, runValidators: true },
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
      { new: true, runValidators: true },
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
