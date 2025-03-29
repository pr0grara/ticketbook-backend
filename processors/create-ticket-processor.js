const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const createTicket = require("../action-handlers/create-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const createTicketProcessorPath = path.join(__dirname, "./processor-util/create-ticket-instructions.txt");
const createTicketInstructions = fs.readFileSync(createTicketProcessorPath, "utf-8");

async function createTicketProcessor(action, reqBody) {
    try {
        const { context, userInput, userId, aiHistory } = reqBody;
        const { shortcut } = action;

        console.log("🔹 CREATE TICKET REQUEST:", '"', userInput, '"');

        const previousAIResponse = aiHistory?.interactions[0]?.aiResponse;
        const previousAIResponses = aiHistory?.interactions.slice(1).map(r => r.aiResponse).join("\n\n");

        const systemMessage = `

${createTicketInstructions}

###STRICT AMBIGUITY RESOLUTION ORDER (MANDATORY):

When processing user input, you MUST strictly follow this ambiguity resolution order:

1. **Immediate Previous AI Response (Highest Priority):**
   - If the user's request logically continues or directly relates to your most recent AI response, you MUST use that response to create a relevant task, checklist, shopping list, or actionable ticket.
   - EVEN if the previous response is narrative, explanatory, or conversational (e.g., recipes, instructions, automotive maintenance steps, financial tasks, etc.), you MUST extract actionable tasks or checklist items from it.

   **Most Recent AI Response (CRITICAL CONTEXT)**:
   ${previousAIResponse ? previousAIResponse : previousAIResponse === '' ? 'None provided.' : previousAIResponse}

2. **Earlier AI Responses:**
   If unresolved, reference prior AI interactions chronologically:
   ${previousAIResponses || 'None'}

3. **Explicitly Provided Context**:
   If still unresolved, consider the context provided explicitly:
   ${JSON.stringify(context, null, 2)}

### ONLY RETURN AN AMBIGUITY ERROR IF:
- Steps 1–3 FAIL to clarify the request clearly.
- NO actionable tasks, instructions, or checklist items can be identified.

${dateTimeNow}
`;

        console.log(systemMessage)
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `userId: ${userId}\n${systemMessage}` },
                { role: "user", content: userInput }
            ],
            response_format: { type: "json_object" }
        });

        if (!aiResponse.choices || !aiResponse.choices[0].message) {
            throw new Error("Invalid AI response structure.");
        }

        const response = typeof aiResponse.choices[0].message.content === "string"
            ? JSON.parse(aiResponse.choices[0].message.content)
            : aiResponse.choices[0].message.content;

        if (response.error) return { action_type: "error", status: "error", message: response.error }

        return await createTicket(response);

    } catch (error) {
        console.error("[Create Ticket Processor Error]:", error.message);
        return { status: "fatal_error", message: error.message };
    }
}

module.exports = createTicketProcessor;
