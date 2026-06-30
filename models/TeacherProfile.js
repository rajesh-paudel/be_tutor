import mongoose from "mongoose";

const TeacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  subjects: [{ type: String, required: true, index: true }],
  teachingLevels: [{ type: String, index: true }],
  hourlyRate: { type: Number, required: true },
  experienceYears: { type: Number, required: true },
  bio: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verificationDocs: [{ type: String }], // URLs to identity or academic certificates
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  weeklyAvailability: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      slots: [
        {
          startTime: String, // "10:00"
          endTime: String, // "11:00"
        },
      ],
    },
  ],
});

export default mongoose.models.TeacherProfile ||
  mongoose.model("TeacherProfile", TeacherProfileSchema);
