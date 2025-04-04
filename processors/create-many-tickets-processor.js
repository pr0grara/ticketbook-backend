const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const createTicket = require("../action-handlers/create-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const createTicketsProcessorPath = path.join(__dirname, "./processor-util/create-many-tickets-instructions.txt");
const createTicketsInstructions = fs.readFileSync(createTicketsProcessorPath, "utf-8"); // Read as string


async function createManyTicketsProcessor(action, reqBody, userMessage) {
    try {
        const { userId } = reqBody; // ✅ Fixed extraction (no .body)
        console.log("[createManyTicketsProcessor] Received:", { action, userId });

        const systemMessage = `
        ${createTicketsInstructions}
        ${dateTimeNow}
        `;

        // Step 1: Call ChatGPT to refine ticket creation request
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
        };

        const response = typeof aiResponse.choices[0].message.content === "string"
            ? JSON.parse(aiResponse.choices[0].message.content)
            : aiResponse.choices[0].message.content;

        // if (!!response.error) throw new Error(`AI error within create-many-tickets.js: ${JSON.stringify(response.error)}`);
        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "CREATE_MANY_TICKETS`" }
        
        if (!Array.isArray(response.newTickets) || response.newTickets.length === 0) {
            throw new Error("AI response did not contain valid newTickets.");
        }

        // Step 2: Call createTicket action handler with AI-refined data and create receipt
        let ticketReceipts = [];

        let newTickets = response.newTickets.map(tick => {
            tick["userId"] = userId;
            return tick;
        });

        console.log("AI-Generated Tickets + hardcoded userId: ", newTickets);

    
        for (const newTicket of newTickets) {
            let receipt = await createTicket(newTicket);
            ticketReceipts.push(receipt);
        }
        // for (const newTicket of response.newTickets) {
        //     let receipt = await createTicket(newTicket);
        //     ticketReceipts.push(receipt);
        // }

        //Step 3: Return receipt to preprocessor
        return { action_type: "create_many_tickets", status: "completed", message: "New tickets created.", newTickets: ticketReceipts };
    } catch (error) {
        console.error("[Create Ticket Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = createManyTicketsProcessor;