const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const { dateTimeNow } = require("./processor-util/processor-util");

const provideAnswerProcessorPath = path.join(__dirname, "./processor-util/provide-answer-instructions.txt");
const provideAnswerInstructions = fs.readFileSync(provideAnswerProcessorPath, "utf-8"); // Read as string

async function provideAnswerProcessor(action, reqBody) {
    try {
        const { userInput, userId, context, aiHistory } = reqBody;

        let conversation = aiHistory?.interactions?.flatMap(entry => [
            { role: "user", content: entry.userMessage },
            { role: "assistant", content: entry.aiResponse }
        ]) || [];

        console.log("🔹 Received Provide Answer Request:", userInput);

        const systemMessage = `
        ${provideAnswerInstructions}

        Context:
        ${JSON.stringify(context, null, 2)}
        Chat History:
        ${JSON.stringify(conversation)}
        `;

        // Step 1: Call ChatGPT to generate an answer
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `userId: ${userId}\n` + systemMessage + dateTimeNow },
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

        console.log("✅ AI-Generated Answer:", response);

        return { action_type: "provide_answer", status: "completed", message: response };
    } catch (error) {
        console.error("[Provide Answer Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = provideAnswerProcessor;