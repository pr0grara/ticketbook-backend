const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const createTicket = require("../action-handlers/create-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const createTicketProcessorPath = path.join(__dirname, "./processor-util/create-ticket-instructions.txt");
const createTicketInstructions = fs.readFileSync(createTicketProcessorPath, "utf-8");

async function createTicketProcessor(action, reqBody, userMessage) {
    try {
        const { userId } = reqBody;
        const { shortcut } = action;

        console.log("[createTicketProcessor] Received:", { action, userId });;

        const systemMessage = `
${createTicketInstructions}

shortcut mode: ${!!shortcut ? 'active' : 'inactive'}

${dateTimeNow}
`.trim();
// console.log(systemMessage)
        // console.log(systemMessage)
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `userId: ${userId}\n${systemMessage}` },
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

        console.log(response)
        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "CREATE_TICKET" }
        let newTicket = {...response, userId};
        // console.log(newTicket);

        return await createTicket(newTicket);

    } catch (error) {
        console.error("[Create Ticket Processor Error]:", error.message);
        return { status: "fatal_error", message: error.message };
    }
}

module.exports = createTicketProcessor;
