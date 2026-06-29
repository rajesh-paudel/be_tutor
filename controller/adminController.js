import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import Booking from "../models/Booking.js";

// @desc    Fetch site-wide performance analytics and statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin Only)
export const getPlatformStats = async (req, res) => {
  try {
    // 1. Gather concurrent numerical metrics counters
    const totalUsersCount = await User.countDocuments();
    const totalStudentsCount = await User.countDocuments({ role: "student" });
    const totalTeachersCount = await User.countDocuments({ role: "teacher" });

    // Gather system verification metrics breakdowns
    const pendingTeachersCount = await TeacherProfile.countDocuments({
      verificationStatus: "pending",
    });
    const approvedTeachersCount = await TeacherProfile.countDocuments({
      verificationStatus: "approved",
    });

    // Gather global schedule booking logs parameters
    const totalBookingsCount = await Booking.countDocuments();
    const completedBookingsCount = await Booking.countDocuments({
      status: "completed",
    });
    const pendingBookingsCount = await Booking.countDocuments({
      status: "pending",
    });

    // 2. Format a structured composite dataset back to the front-end dashboard visualization layer
    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsersCount,
          students: totalStudentsCount,
          teachers: totalTeachersCount,
        },
        teachersAudit: {
          pendingVerification: pendingTeachersCount,
          approvedActive: approvedTeachersCount,
        },
        bookings: {
          total: totalBookingsCount,
          completed: completedBookingsCount,
          pending: pendingBookingsCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve or Reject a teacher's background registration credentials
// @route   PUT /api/admin/teachers/:id/verify
// @access  Private (Admin Only)
export const verifyTeacherProfile = async (req, res) => {
  try {
    const profileId = req.params.id; // Target TeacherProfile document Object ID
    const { status } = req.body; // Expects 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid verification transition requested.",
        });
    }

    const updatedProfile = await TeacherProfile.findByIdAndUpdate(
      profileId,
      { $set: { verificationStatus: status } },
      { new: true, runValidators: true },
    ).populate("userId", "name email");

    if (!updatedProfile) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Target teacher profile record not found.",
        });
    }

    return res.status(200).json({
      success: true,
      message: `Teacher background verification status set to ${status}.`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Suspend or unsuspend a user account instantly
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin Only)
export const toggleUserSuspension = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { isSuspended } = req.body; // Expects true or false boolean

    if (typeof isSuspended !== "boolean") {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Suspension configuration toggle parameter must be a boolean value.",
        });
    }

    // Prevent administrators from accidentally locking themselves out of the framework management console
    if (targetUserId === req.user._id.toString()) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Administrative safety fault. You cannot lock out your own supervisor profile.",
        });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { isSuspended } },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Target user account profile file layer missing.",
        });
    }

    const resolutionMessage = isSuspended
      ? "User account has been flagged and suspended from the active platform loop."
      : "User account has been successfully restored and reinstated.";

    return res.status(200).json({
      success: true,
      message: resolutionMessage,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
