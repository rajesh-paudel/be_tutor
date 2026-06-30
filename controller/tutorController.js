import TeacherProfile from "../models/TeacherProfile.js";
import User from "../models/User.js";

const SORT_HANDLERS = {
  rating: (a, b) => b.averageRating - a.averageRating,
  experience: (a, b) => b.experienceYears - a.experienceYears,
  price_low: (a, b) => a.hourlyRate - b.hourlyRate,
  price_high: (a, b) => b.hourlyRate - a.hourlyRate,
  recommended: (a, b) => b.recommendationScore - a.recommendationScore,
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNumberFilter(value, fieldName) {
  if (value === undefined || value === "") return null;

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldName} must be a valid positive number.`);
  }

  return parsedValue;
}

// @desc    Search and Rank Tutors using Weighted Recommendation Scoring
// @route   GET /api/tutors/search
// @access  Public
export const searchAndRecommendTutors = async (req, res) => {
  try {
    const {
      search,
      subject,
      level,
      minPrice,
      maxPrice,
      minExperience,
      minRating,
      sort = "recommended",
      status,
    } = req.query;

    const parsedMinPrice = parseNumberFilter(minPrice, "minPrice");
    const parsedMaxPrice = parseNumberFilter(maxPrice, "maxPrice");
    const parsedMinExperience = parseNumberFilter(
      minExperience,
      "minExperience",
    );
    const parsedMinRating = parseNumberFilter(minRating, "minRating");

    if (
      parsedMinPrice !== null &&
      parsedMaxPrice !== null &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return res.status(400).json({
        success: false,
        error: "minPrice cannot be greater than maxPrice.",
      });
    }

    const filterQuery = {
      verificationStatus:
        status === "approved"
          ? "approved"
          : status === "pending"
            ? "pending"
            : { $ne: "rejected" },
    };

    if (subject) {
      filterQuery.subjects = { $regex: new RegExp(escapeRegex(subject), "i") };
    }

    if (parsedMinPrice !== null || parsedMaxPrice !== null) {
      filterQuery.hourlyRate = {};
      if (parsedMinPrice !== null) filterQuery.hourlyRate.$gte = parsedMinPrice;
      if (parsedMaxPrice !== null) filterQuery.hourlyRate.$lte = parsedMaxPrice;
    }

    if (parsedMinExperience !== null) {
      filterQuery.experienceYears = { $gte: parsedMinExperience };
    }

    if (parsedMinRating !== null) {
      filterQuery.averageRating = { $gte: parsedMinRating };
    }

    const andFilters = [];

    if (level) {
      const levelRegex = new RegExp(escapeRegex(level), "i");
      andFilters.push({
        $or: [
          { teachingLevels: levelRegex },
          { academicLevels: levelRegex },
          { subjects: levelRegex },
          { bio: levelRegex },
        ],
      });
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await User.find({
        role: "teacher",
        isSuspended: false,
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");

      andFilters.push({
        $or: [
          { subjects: searchRegex },
          { bio: searchRegex },
          { userId: { $in: matchingUsers.map((user) => user._id) } },
        ],
      });
    }

    if (andFilters.length > 0) {
      filterQuery.$and = andFilters;
    }

    const tutors = await TeacherProfile.find(filterQuery)
      .populate({
        path: "userId",
        select: "name profileImage email isSuspended",
        match: { isSuspended: false },
      })
      .lean();

    const rankedTutors = tutors.filter((tutor) => tutor.userId).map((tutor) => {
      const WEIGHT_RATING = 0.4;
      const WEIGHT_EXPERIENCE = 0.3;
      const WEIGHT_PRICE = 0.3;

      const ratingScore = Math.min((tutor.averageRating || 0) / 5, 1);
      const experienceScore = Math.min((tutor.experienceYears || 0) / 10, 1);

      let priceScore = 0;
      if (parsedMaxPrice !== null) {
        if (tutor.hourlyRate <= parsedMaxPrice) {
          priceScore = 1;
        } else {
          const budgetDeficit = tutor.hourlyRate - parsedMaxPrice;
          priceScore = Math.max(0, 1 - budgetDeficit / parsedMaxPrice);
        }
      } else {
        priceScore =
          tutor.hourlyRate <= 50
            ? 1
            : Math.max(0, 1 - (tutor.hourlyRate - 50) / 100);
      }

      const recommendationScore =
        ratingScore * WEIGHT_RATING +
        experienceScore * WEIGHT_EXPERIENCE +
        priceScore * WEIGHT_PRICE;

      return {
        profileId: tutor._id,
        teacherId: tutor.userId._id,
        name: tutor.userId.name,
        profileImage: tutor.userId.profileImage,
        email: tutor.userId.email,
        subjects: tutor.subjects,
        teachingLevels: tutor.teachingLevels,
        hourlyRate: tutor.hourlyRate,
        experienceYears: tutor.experienceYears,
        averageRating: tutor.averageRating,
        reviewCount: tutor.reviewCount,
        verificationStatus: tutor.verificationStatus,
        bio: tutor.bio,
        weeklyAvailability: tutor.weeklyAvailability,
        recommendationScore: Number((recommendationScore * 100).toFixed(0)),
      };
    });

    rankedTutors.sort(SORT_HANDLERS[sort] || SORT_HANDLERS.recommended);

    return res.status(200).json({
      success: true,
      count: rankedTutors.length,
      data: rankedTutors,
    });
  } catch (error) {
    if (error.message.includes("must be a valid positive number")) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(500).json({ success: false, error: error.message });
  }
};
