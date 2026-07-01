import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String, default: "" }, // Score value or letter grade
  feedback: { type: String, default: "" }, // Teacher notes or AI optimization feedback
});

const AssignmentSchema = new mongoose.Schema({
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
  instructions: { type: String, required: true },
  subject: { type: String, required: true },
  dueDate: { type: Date, required: true },
  attachments: [{ type: String }],
  submissions: [SubmissionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Assignment ||
  mongoose.model("Assignment", AssignmentSchema);
