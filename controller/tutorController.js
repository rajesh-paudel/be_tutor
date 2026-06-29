import TeacherProfile from "../models/TeacherProfile.js";

// @desc    Search and Rank Tutors using Weighted Recommendation Scoring
// @route   GET /api/tutors/search
// @access  Private (Authenticated Students)
export const searchAndRecommendTutors = async (req, res) => {
  try {
    // 1. Extract query criteria parameters from incoming request
    const { subject, maxPrice, minExperience, minRating } = req.query;

    // 2. Build standard MongoDB filter query object dynamically
    const filterQuery = {
      verificationStatus: "approved", // Only show background-verified educators
    };

    // Filter by subject using a case-insensitive regex search
    if (subject) {
      filterQuery.subjects = { $regex: new RegExp(subject, "i") };
    }

    // Filter by pricing parameters
    if (maxPrice) {
      filterQuery.hourlyRate = { $lte: Number(maxPrice) };
    }

    // Filter by career longevity minimums
    if (minExperience) {
      filterQuery.experienceYears = { $gte: Number(minExperience) };
    }

    // Filter by quality metrics minimums
    if (minRating) {
      filterQuery.averageRating = { $gte: Number(minRating) };
    }

    // 3. Query the database and populate user accounts data
    const tutors = await TeacherProfile.find(filterQuery).populate(
      "userId",
      "name profileImage email",
    );

    // 4. Run the Weighted Scoring Recommendation Engine across matching items
    const rankedTutors = tutors.map((tutor) => {
      const WEIGHT_RATING = 0.4;
      const WEIGHT_EXPERIENCE = 0.3;
      const WEIGHT_PRICE = 0.3;

      // Normalize Rating out of a 1.0 maximum scale
      const ratingScore = tutor.averageRating / 5;

      // Normalize Experience (Cap perfect score weight utility at 10 years)
      const experienceScore = Math.min(tutor.experienceYears / 10, 1);

      // Price Match Optimization Score
      let priceScore = 0;
      if (maxPrice) {
        const standardBudget = Number(maxPrice);
        if (tutor.hourlyRate <= standardBudget) {
          priceScore = 1; // Rate is ideally within bounds or below budget limits
        } else {
          // Calculate an incremental score penalty based on percentage exceeded
          const budgetDeficit = tutor.hourlyRate - standardBudget;
          priceScore = Math.max(0, 1 - budgetDeficit / standardBudget);
        }
      } else {
        // If student does not enter budget bounds, normalize base score against a standard rate threshold
        priceScore =
          tutor.hourlyRate <= 50
            ? 1
            : Math.max(0, 1 - (tutor.hourlyRate - 50) / 100);
      }

      // Aggregate final math equation values
      const recommendationScore =
        ratingScore * WEIGHT_RATING +
        experienceScore * WEIGHT_EXPERIENCE +
        priceScore * WEIGHT_PRICE;

      // Return a clean data structure back to the frontend application layout
      return {
        profileId: tutor._id,
        teacherId: tutor.userId._id,
        name: tutor.userId.name,
        profileImage: tutor.userId.profileImage,
        email: tutor.userId.email,
        subjects: tutor.subjects,
        hourlyRate: tutor.hourlyRate,
        experienceYears: tutor.experienceYears,
        averageRating: tutor.averageRating,
        weeklyAvailability: tutor.weeklyAvailability,
        recommendationScore: parseFloat(recommendationScore.toFixed(4)), // Round to 4 decimals
      };
    });

    // 5. Sort Array by recommendation score in descending order (highest score first)
    rankedTutors.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return res.status(200).json({
      success: true,
      count: rankedTutors.length,
      data: rankedTutors,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
