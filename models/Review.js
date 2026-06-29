import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Auto-aggregate and recalculate tutor rating on save
ReviewSchema.post("save", async function () {
  const TeacherProfile = mongoose.model("TeacherProfile");

  const stats = await this.model("Review").aggregate([
    { $match: { teacherId: this.teacherId } },
    {
      $group: {
        _id: "$teacherId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await TeacherProfile.findOneAndUpdate(
      { userId: this.teacherId },
      {
        averageRating: parseFloat(stats[0].avgRating.toFixed(2)),
        reviewCount: stats[0].totalReviews,
      },
    );
  }
});

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
