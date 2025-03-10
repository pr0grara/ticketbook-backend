const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");

async function createTicket(ticket) {
    try {
        let { userId, goalId, ...ticketData } = ticket;

        // Ensure userId exists
        if (!userId) {
            throw new Error("User ID is required to create a Ticket.");
        }

        // Convert IDs to ObjectId if they are strings
        userId = new mongoose.Types.ObjectId(userId);
        goalId = goalId ? new mongoose.Types.ObjectId(goalId) : null;

        const newTicket = new Ticket({ userId, goalId, ...ticketData });

        console.log("🟢 Creating Ticket:", JSON.stringify(newTicket, null, 2));

        const savedTicket = await newTicket.save();

        console.log("✅ Ticket Saved:", JSON.stringify(savedTicket, null, 2));

        return { action_type: "create_ticket", status: "completed", message: "New ticket created.", newTicket: savedTicket };

    } catch (error) {
        console.error("[Create Ticket Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = createTicket;