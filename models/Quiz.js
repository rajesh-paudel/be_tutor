import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of 4 possibilities
  correctAnswerIndex: { type: Number, required: true }, // Index corresponding to correct item
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
});

const QuizPerformanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  score: { type: Number, required: true }, // Out of 100
  attemptedAt: { type: Date, default: Date.now },
});

const QuizSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  isGeneratedByAI: { type: Boolean, default: false },
  questions: [QuestionSchema],
  attempts: [QuizPerformanceSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
