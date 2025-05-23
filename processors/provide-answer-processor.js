const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const { dateTimeNow } = require("./processor-util/processor-util");

const provideAnswerProcessorPath = path.join(__dirname, "./processor-util/provide-answer-instructions.txt");
const provideAnswerInstructions = fs.readFileSync(provideAnswerProcessorPath, "utf-8"); // Read as string

async function provideAnswerProcessor(action, reqBody, userMessage) {
    try {
        const { userId } = reqBody;

        console.log("[provideAnswerProcessor] Received:", { action, userId });

        const systemMessage = `
${provideAnswerInstructions}

###STRICT AMBIGUITY RESOLUTION ORDER (MANDATORY):

When processing user input, you MUST strictly follow this ambiguity resolution order:

1. **Immediate Previous AI Response (Highest Priority):**
   - If the user's request logically continues or directly relates to your most recent AI response, you MUST use that response to create a relevant task, checklist, shopping list, or actionable ticket.
   - EVEN if the previous response is narrative, explanatory, or conversational (e.g., recipes, instructions, automotive maintenance steps, financial tasks, etc.), you MUST extract actionable tasks or checklist items from it.

2. **Earlier AI Responses:**
   If unresolved, reference prior AI interactions chronologically.

3. **Explicitly Provided Context**:
   If still unresolved, consider the entire context provided.

### ONLY RETURN AN AMBIGUITY ERROR IF:
- Steps 1–3 FAIL to clarify the request clearly.
- NO actionable tasks, instructions, or checklist items can be identified.

${dateTimeNow}
        `.trim();

        // Step 1: Call ChatGPT to generate an answer
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
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

        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "PROVIDE_ANSWER" }
        // console.log("AI-Generated Answer:", response);

        return { action_type: "provide_answer", status: "completed", message: response };
    } catch (error) {
        console.error("[Provide Answer Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = provideAnswerProcessor;