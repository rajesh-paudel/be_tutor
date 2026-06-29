import Review from "../models/Review.js";
import Booking from "../models/Booking.js";

// @desc    Submit a rating/review for a tutor
// @route   POST /api/reviews
// @access  Private (Student Only)
export const createReview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { teacherId, rating, comment } = req.body;

    // 1. Structural Verification
    if (!teacherId || !rating || !comment) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Missing mandatory review processing elements.",
        });
    }

    const numericalRating = Number(rating);
    if (numericalRating < 1 || numericalRating > 5) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Rating parameter value boundary must fall precisely between 1 and 5.",
        });
    }

    // 2. Academic Verification (Optional but highly recommended for defenses)
    // Verify if the student has actually completed an active booking session with this tutor
    const validBooking = await Booking.findOne({
      studentId,
      teacherId,
      status: "completed",
    });

    if (!validBooking) {
      return res.status(403).json({
        success: false,
        error:
          "Review request denied. You can only rate educators with whom you have completed a scheduled session.",
      });
    }

    // 3. Collision Check: Prevent duplicate reviews for the same teacher
    const duplicateReview = await Review.findOne({ studentId, teacherId });
    if (duplicateReview) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "You have already submitted a platform evaluation review for this instructor.",
        });
    }

    // 4. Persistence Layout Generation
    // The pre/post save hooks in the schema handle rolling calculations automatically
    const newReview = await Review.create({
      studentId,
      teacherId,
      rating: numericalRating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review successfully recorded and analytics updated.",
      data: newReview,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all reviews for a specific tutor profile
// @route   GET /api/reviews/teacher/:teacherId
// @access  Public
export const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const reviews = await Review.find({ teacherId })
      .populate("studentId", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
