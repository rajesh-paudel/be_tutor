import Quiz from "../models/Quiz.js";

// @desc    Create a new manual or AI-generated quiz
// @route   POST /api/quizzes
// @access  Private (Teacher Only)
export const createQuiz = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { title, subject, questions, isGeneratedByAI } = req.body;

    if (!title || !subject || !questions || !Array.isArray(questions)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Missing core quiz validation properties.",
        });
    }

    const newQuiz = await Quiz.create({
      teacherId,
      title,
      subject,
      questions,
      isGeneratedByAI: isGeneratedByAI || false,
    });

    return res.status(201).json({
      success: true,
      message: "Evaluation quiz created successfully.",
      data: newQuiz,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit quiz answers and process results via the Adaptive Learning Engine
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student Only)
export const submitQuizAttempt = async (req, res) => {
  try {
    const studentId = req.user._id;
    const quizId = req.params.id;
    const { studentAnswers } = req.body; // Expects array of indices: [0, 2, 1, 3] corresponding to question choices

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, error: "Target quiz not found." });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // Evaluate answers against stored schema indices
    quiz.questions.forEach((question, index) => {
      if (
        studentAnswers[index] !== undefined &&
        studentAnswers[index] === question.correctAnswerIndex
      ) {
        correctCount++;
      }
    });

    // Calculate accuracy percentage
    const performancePercentage = Math.round(
      (correctCount / totalQuestions) * 100,
    );

    // ADAPTIVE DIFFICULTY TUNING LOGIC
    // Determine the next recommended path based on performance thresholds
    let adaptiveRecommendation = "";
    if (performancePercentage >= 80) {
      adaptiveRecommendation =
        "Excellent performance! The system has adjusted your difficulty to HARD for subsequent modules.";
    } else if (performancePercentage <= 45) {
      adaptiveRecommendation =
        "Review recommended. The system has adjusted your path to EASY to help reinforce core concepts.";
    } else {
      adaptiveRecommendation =
        "Steady progress. Your difficulty path remains set to MEDIUM.";
    }

    // Append the attempt data directly into the quiz metrics tracking array
    quiz.attempts.push({
      studentId,
      score: performancePercentage,
    });

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz evaluated successfully.",
      results: {
        scorePercentage: performancePercentage,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        adaptivePath: adaptiveRecommendation,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all available quizzes (Filterable by Adaptive Difficulty parameters)
// @route   GET /api/quizzes
// @access  Private (Authenticated Users)
export const getQuizzes = async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    const matchCriteria = {};

    if (subject) {
      matchCriteria.subject = { $regex: new RegExp(subject, "i") };
    }

    // Filter sub-questions directly if the student requests a specific matching difficulty pool
    if (difficulty) {
      matchCriteria["questions.difficulty"] = difficulty;
    }

    const quizzes = await Quiz.find(matchCriteria)
      .populate("teacherId", "name profileImage")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
