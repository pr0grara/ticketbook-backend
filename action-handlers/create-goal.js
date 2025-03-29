const mongoose = require('mongoose');
const Goal = require("../models/Goal");

async function createGoal(goal, createType) {
    try {
        const { userId, title, parentGoal, subGoals, category, ...rest } = goal;

        // Ensure userId and title exist
        if (!userId || !title) {
            return { action_type: "error", status: "error", message: "User ID and Title are required to create a goal." }
        }

        const goalData = {
            userId,
            category: category || "",
            title,
            ...rest,
            parentGoal: parentGoal ? new mongoose.Types.ObjectId(parentGoal) : null, // Convert string to ObjectId
            subGoals: Array.isArray(subGoals) ? subGoals.map(id => new mongoose.Types.ObjectId(id)) : [],
        };

        console.log("🟢 Creating Goal:", JSON.stringify(goalData, null, 2));

        const newGoal = new Goal(goalData);
        const savedGoal = await newGoal.save();

        console.log("✅ Goal Saved:", JSON.stringify(savedGoal, null, 2));

        return { action_type: createType?.isBucket ? "create_bucket" : "create_goal", status: "completed", message: `New ${createType?.isBucket ? "Bucket" : "Goal"} created.`, newGoal: savedGoal };

    } catch (error) {
        console.error("[Create Goal Error]:", error.message);
        return { action_type: "error", status: "error", message: error.message };
    }
}

module.exports = createGoal;
