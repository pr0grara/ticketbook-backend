const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const { dateTimeNow } = require("./processor-util/processor-util");

const provideAdviceProcessorPath = path.join(__dirname, "./processor-util/provide-advice-instructions.txt");
const provideAdviceInstructions = fs.readFileSync(provideAdviceProcessorPath, "utf-8"); // Read as string

async function provideAdviceProcessor(action, reqBody, userMessage) {
    try {
        const { userInput, userId } = reqBody;

        console.log("[provideAdviceProcessor] Received:", { action, userInput, userId });

        const systemMessage = provideAdviceInstructions;

        // Step 1: Call ChatGPT to generate an answer
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

        const response = typeof aiResponse.choices[0].message.content === "string"
            ? JSON.parse(aiResponse.choices[0].message.content)
            : aiResponse.choices[0].message.content;
        
        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "PROVIDE_ADVICE" }

        // console.log("AI-Generated Advice:", response);

        return { action_type: "provide_advice", status: "completed", message: response };
    } catch (error) {
        console.error("[Provide Advice Processor Error]:", error.message);
        return { status: "error", message: error.message };
    }
}

module.exports = provideAdviceProcessor;