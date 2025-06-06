const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", default: null },  //Can be standalone
    title: { type: String, required: true },
    text: { type: String, required: true },
    notes: { type: Array, default: [" "] },
    checklist: { type: Array },
    status: { type: String, enum: ["pending", "in-progress", "done"], default: "pending" },
    priority: { type: String, enum: ["LOW", "MED", "HIGH"], default: "MED" },
    priorityWeight: { type: Number, min: 1, max: 100 },
    depends_on: { type: String },
    deadline: { type: Date },
    order: { type: Number },
    doToday: { type: Boolean, default: false },
    doSoon: { type: Boolean, default: false },
    isQuickWin: { type: Boolean, default: false },
    isDeepFocus: { type: Boolean, default: false },
    isRecurring: { type: String, enum: ["", "daily", "weekly", "monthly"], default: "" },
    setToday: { type: Date },
    setSoon: { type: Date },
    baselineManifest: { type: Object, default: {} },
    healthType: { type: String, enum: ["", "diet", "exercise", "habit"], default: "" }
}, { timestamps: true });

// isRecurring: { type: Boolean, default: false },
// Ensure no duplicate indexes
TicketSchema.index({ title: 1, userId: 1 }, { unique: false });

const Ticket = mongoose.model("tickets", TicketSchema);
module.exports = Ticket;