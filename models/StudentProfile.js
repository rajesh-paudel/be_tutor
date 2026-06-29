import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  interests: [{ type: String }], // Saved topic preferences
  academicLevel: { type: String, default: "" },
  completedSessions: { type: Number, default: 0 },
});

export default mongoose.models.StudentProfile ||
  mongoose.model("StudentProfile", StudentProfileSchema);
