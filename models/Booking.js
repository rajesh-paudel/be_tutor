import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
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
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // "14:00"
  endTime: { type: String, required: true }, // "15:00"
  meetingLink: { type: String, default: "" }, // Virtual classroom destination
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

// Optimization index to accelerate conflict check operations
BookingSchema.index({ teacherId: 1, date: 1, status: 1 });

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
