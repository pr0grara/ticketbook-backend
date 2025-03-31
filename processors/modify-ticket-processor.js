const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const modifyTicket = require("../action-handlers/modify-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const modifyTicketProcessorPath = path.join(__dirname, "./processor-util/modify-ticket-instructions.txt");
const modifyTicketInstructions = fs.readFileSync(modifyTicketProcessorPath, "utf-8"); // Read as string

async function modifyTicketProcessor(reqBody) {
    try {
        const { userInput, context, userId } = reqBody; // Extract all necessary data

        // 🟢 Create system message with full context
        const systemMessage = `
        ${modifyTicketInstructions}
        
        Use the provided context to identify the correct ticket and process modifications accordingly.

        ### EXISTING TICKETS CONTEXT:
        ${JSON.stringify(context.allTickets, null, 2)}
        `;

        // 🟢 Create user message separately
        const userMessage = `User Input: ${userInput}`;

        console.log("📡 SYSTEM MESSAGE SENT TO AI:\n", systemMessage);
        console.log("📩 USER MESSAGE SENT TO AI:\n", userMessage);

        // 🔹 Call ChatGPT for ticket modification request
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage + dateTimeNow },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" }
        });

        if (!aiResponse.choices || !aiResponse.choices[0].message) {
            throw new Error("Invalid AI response structure.");
        }

        const response = JSON.parse(aiResponse.choices[0].message.content);
        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "MODIFY_TICKET" }

        console.log("🔹 AI RESPONSE:", response);

        // 🔹 Call modifyTicket action handler with AI-refined data
        return await modifyTicket(response);

    } catch (error) {
        console.error("[Modify Ticket Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = modifyTicketProcessor;