import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  fileUrl: { type: String, required: true }, // Object Storage Link (Firebase/Cloudinary)
  fileType: { type: String, enum: ["pdf", "image", "video"], required: true },
  aiSummary: { type: String, default: "" }, // AI Summarizer Output Cache
  downloadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Resource ||
  mongoose.model("Resource", ResourceSchema);
