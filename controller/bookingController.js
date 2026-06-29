import Booking from "../models/Booking.js";
import TeacherProfile from "../models/TeacherProfile.js";

// @desc    Create a new tutor session booking with Conflict Detection
// @route   POST /api/bookings
// @access  Private (Student Only)
export const createBooking = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { teacherId, date, startTime, endTime } = req.body;

    // 1. Structural Validation
    if (!teacherId || !date || !startTime || !endTime) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Missing mandatory schedule reservation variables.",
        });
    }

    // 2. Format validation check (ensure 24h format "HH:MM")
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid time string format. Use HH:MM format.",
        });
    }

    if (startTime >= endTime) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Start time cannot be equal to or greater than end time.",
        });
    }

    // 3. SLOTS CONFLICT DETECTION ALGORITHM
    // Queries database for conflicting records on the same date for the teacher
    const conflictingBooking = await Booking.findOne({
      teacherId,
      date,
      status: "accepted", // Only confirmed bookings create conflicts
      $and: [
        { startTime: { $lt: endTime } }, // S1 < E2
        { endTime: { $gt: startTime } }, // S2 < E1
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        error:
          "Slot conflict identified. This slot overlaps with an existing appointment.",
      });
    }

    // 4. Create the booking entry (defaults to 'pending' state until accepted by the teacher)
    const newBooking = await Booking.create({
      studentId,
      teacherId,
      date,
      startTime,
      endTime,
      meetingLink: `https://meet.jit.si/${teacherId}-${date}-${startTime.replace(":", "")}`, // Generates a reliable demo classroom link
    });

    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully.",
      data: newBooking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update Booking status (Accept/Reject slots)
// @route   PUT /api/bookings/:id/status
// @access  Private (Teacher Only)
export const updateBookingStatus = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const bookingId = req.params.id;
    const { status } = req.body; // Expects 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid workflow status update requested.",
        });
    }

    // Fetch the target booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, error: "Booking entry not found." });
    }

    // Authorization verification
    if (booking.teacherId.toString() !== teacherId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Access denied. You do not manage this schedule.",
        });
    }

    // If accepting, run a secondary safety check to ensure no other booking was accepted in parallel
    if (status === "accepted") {
      const activeConflict = await Booking.findOne({
        _id: { $ne: bookingId },
        teacherId: booking.teacherId,
        date: booking.date,
        status: "accepted",
        $and: [
          { startTime: { $lt: booking.endTime } },
          { endTime: { $gt: booking.startTime } },
        ],
      });

      if (activeConflict) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Cannot accept. Parallel slot conflict has already been confirmed.",
          });
      }
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking has been successfully ${status}.`,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get bookings for the logged-in user (Student or Teacher)
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let bookings = [];

    if (role === "student") {
      bookings = await Booking.find({ studentId: userId })
        .populate("teacherId", "name profileImage email")
        .sort({ date: 1, startTime: 1 });
    } else if (role === "teacher") {
      bookings = await Booking.find({ teacherId: userId })
        .populate("studentId", "name profileImage email")
        .sort({ date: 1, startTime: 1 });
    }

    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
