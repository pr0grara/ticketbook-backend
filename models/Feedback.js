const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    userId: { type: String, },
    userFeedback: { type: String, required: true },
}, { timestamps: true });

const Feedback = mongoose.model("feedbacks", FeedbackSchema);

module.exports = Feedback;