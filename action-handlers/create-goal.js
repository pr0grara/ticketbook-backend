const mongoose = require('mongoose');
const Goal = require("../models/Goal");

async function createGoal(goal) {
    try {
        const { userId, title, parentGoal, subGoals, ...rest } = goal;

        // Ensure userId and title exist
        if (!userId || !title) {
            return { action_type: "error", status: "error", message: "User ID and Title are required to create a goal." }
        }

        const goalData = {
            userId,
            title,
            ...rest,
            parentGoal: parentGoal ? new mongoose.Types.ObjectId(parentGoal) : null, // Convert string to ObjectId
            subGoals: Array.isArray(subGoals) ? subGoals.map(id => new mongoose.Types.ObjectId(id)) : []
        };

        console.log("🟢 Creating Goal:", JSON.stringify(goalData, null, 2));

        const newGoal = new Goal(goalData);
        const savedGoal = await newGoal.save();

        console.log("✅ Goal Saved:", JSON.stringify(savedGoal, null, 2));

        return { action_type: "create_goal", status: "completed", message: "New goal created.", newGoal: savedGoal };

    } catch (error) {
        console.error("[Create Goal Error]:", error.message);
        return { action_type: "error", status: "error", message: error.message };
    }
}

module.exports = createGoal;
