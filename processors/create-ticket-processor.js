const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const createTicket = require("../action-handlers/create-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const createTicketProcessorPath = path.join(__dirname, "./processor-util/create-ticket-instructions.txt");
const createTicketInstructions = fs.readFileSync(createTicketProcessorPath, "utf-8"); // Read as string

async function createTicketProcessor(action, reqBody) {
    try {
        const { context, userInput, userId } = reqBody; // ✅ Fixed extraction (no .body)
        const { clarification_needed } = action;

        console.log("🔹 Received Create Ticket Request:", userInput);

        const systemMessage = `
        ${createTicketInstructions}

        Context:
        ${JSON.stringify(context, null, 2)}
        `;

        const userMessage = `Here is the user input: ${userInput}`;

        // Step 1: Call ChatGPT to refine ticket creation request
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `userId: ${userId}\n` + systemMessage + dateTimeNow },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" }
        });

        if (!aiResponse.choices || !aiResponse.choices[0].message) {
            throw new Error("Invalid AI response structure.");
        }

        const response = typeof aiResponse.choices[0].message.content === "string"
            ? JSON.parse(aiResponse.choices[0].message.content)
            : aiResponse.choices[0].message.content;

        console.log("✅ AI-Generated Ticket:", response);
        if (response.error) throw new Error("Error within create-ticket-processor")
        // Step 2: Call createTicket action handler with AI-refined data
        return await createTicket(response);

    } catch (error) {
        console.error("[Create Ticket Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = createTicketProcessor;