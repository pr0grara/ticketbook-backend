const mongoose = require("mongoose");

const DailySummarySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    summary: { type: Object },
    date: { type: Date, required: true }
}, { timestamps: true });

DailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

const DailySummary = mongoose.model("dailysummaries", DailySummarySchema);

module.exports = DailySummary;