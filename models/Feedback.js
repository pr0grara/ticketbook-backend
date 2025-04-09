const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userFeedback: { type: String, required: true }, //If relevant
}, { timestamps: true });

const Feedback = mongoose.model("feedbacks", FeedbackSchema);

module.exports = Feedback;