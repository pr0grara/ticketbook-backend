const Ticket = require("../models/Ticket");

async function modifyTicket(updateData) {
    try {
        const { ticketId, ...updateFields } = updateData;

        // Ensure ticketId exists
        if (!ticketId) {
            throw new Error("Ticket ID is required.");
        }

        // Remove undefined fields to prevent overwriting with null/undefined
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, updateFields, { new: true });

        if (!updatedTicket) {
            return { status: "error", message: "Ticket not found or improperly updated." };
        }

        return { action_type: "modify_ticket", status: "completed", message: "Ticket updated successfully.", updated_ticket: updatedTicket };
    } catch (error) {
        console.error("[Modify Ticket Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = modifyTicket;
