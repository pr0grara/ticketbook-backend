const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Owner of the goal
    category: { type: String, enum: ["General", "Personal Growth", "Career", "Health & Fitness", "Finance", "Learning", ""] }, // Universal categories
    title: { type: String, required: true },
    priority: { type: Number, min: 1, max: 100 }, // Priority rating
    description: { type: String },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    progress: { type: Number, default: 0 }, // Percentage completion
    shoppingList: { type: Array },
    parentGoal: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", default: null }, // Parent goal (if nested)
    subGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Goal" }], default: [], // Child goals
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }], // Related tasks
    deadline: { type: Date },
    isBucket: { type: Boolean, default: false }
}, { timestamps: true });

const Goal = mongoose.model("Goal", GoalSchema);

module.exports = Goal;