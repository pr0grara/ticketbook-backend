const mongoose = require("mongoose");

const BehaviorSchema = new mongoose.Schema({
    userId: { type: String },
    type: { type: String, enum: ["TICKET", "GOAL", "USER"] },
    ticketType: { type: String, enum: ["CREATE", "CLOSE", "CLOSE_RECURRING", "DELETE", "EDIT", "ADD_SCHEDULING"] },
    editActions: { type: Object },
    goalType: { type: String, enum: ["CREATE", "DELETE", ""] },
    ticketId: { type: String },
    goalId: { type: String },
    title: { type: String },
    recurrenceType: { type: String, enum: ['', 'daily', 'weekly', 'monthly'] }
}, { timestamps: true });

const Behavior = mongoose.model("behaviors", BehaviorSchema);

module.exports = Behavior;