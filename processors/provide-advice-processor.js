const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const { dateTimeNow } = require("./processor-util/processor-util");

const provideAdviceProcessorPath = path.join(__dirname, "./processor-util/provide-advice-instructions.txt");
const provideAdviceInstructions = fs.readFileSync(provideAdviceProcessorPath, "utf-8"); // Read as string

async function provideAdviceProcessor(action, reqBody) {
    try {
        const { userInput, userId, context, aiHistory } = reqBody;

        let conversation = aiHistory?.interactions?.flatMap(entry => [
            { role: "user", content: entry.userMessage },
            { role: "assistant", content: entry.aiResponse }
        ]) || [];

        console.log("🔹 Received Provide Advice Request:", userInput);

        const systemMessage = `
        ${provideAdviceInstructions}

        Context:
        ${JSON.stringify(context, null, 2)}
        Chat History:
        ${JSON.stringify(conversation)}
        `;

        console.log("SYSTEM MESSAGE:\n", systemMessage);

        const userMessage = `Here is the user input: ${userInput}`;

        // Step 1: Call ChatGPT to generate an answer
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

        console.log("✅ AI-Generated Advice:", response);

        return { action_type: "provide_advice", status: "completed", message: response };
    } catch (error) {
        console.error("[Provide Advice Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = provideAdviceProcessor;