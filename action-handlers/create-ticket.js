const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const Behavior = require("../models/Behavior");

async function createTicket(ticket) {
    console.log('ticket from gpt: ', ticket)
    try {
        let { userId, goalId, text, ...ticketData } = ticket;

        // Ensure userId exists
        if (!userId) {
            throw new Error("User ID is required to create a Ticket.");
        }

        // Convert IDs to ObjectId if they are strings
        userId = new mongoose.Types.ObjectId(userId);
        goalId = goalId ? new mongoose.Types.ObjectId(goalId) : null;

        const newTicket = new Ticket({ userId, goalId, text: text || "...", ...ticketData });
        console.log(newTicket)
        if (newTicket.notes?.length === 0) newTicket.notes = [""];
        if (newTicket.checklist?.length === 0) newTicket.checklist = [{ item: "", status: "unchecked" }, { item: "", status: "unchecked" }];
        // console.log("🟢 Creating Ticket:", JSON.stringify(newTicket, null, 2));
        console.log("🟢 Creating Ticket");

        const savedTicket = await newTicket.save();
        
        const behavior = new Behavior({
            userId,
            type: "TICKET",
            ticketType: "CREATE",
            ticketId: savedTicket._id,
            title: savedTicket.title
        })
        behavior.save()
            .then(() => console.log('new ticket behavior logged'))
            .catch(err => console.log(err));

        // console.log("✅ Ticket Saved:", JSON.stringify(savedTicket, null, 2));
        console.log("✅ Ticket Saved");

        return { action_type: "create_ticket", status: "completed", message: "New ticket created.", newTicket: savedTicket };

    } catch (error) {
        console.error("[Create Ticket Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = createTicket;