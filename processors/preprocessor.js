const fs = require("fs");
const path = require("path");
const {
    modifyTicketProcessor,
    createTicketProcessor,
    createManyTicketsProcessor,
    createGoalProcessor,
    deleteGoalProcessor,
    requestInfoProcessor,
    provideAdviceProcessor,
    provideAnswerProcessor
} = require("./index");

const { openai } = require("../util/ai_util");

// const preprocessorContextPath = path.join(__dirname, "../util/ai_instructions/preprocessor.txt");
const preprocessorContextPath = path.join(__dirname, "./processor-util/preprocessorTest.txt");
const preprocessorContext = fs.readFileSync(preprocessorContextPath, "utf-8"); // Read as string

const preprocessor = async (request) => {
    try {
        const { userInput, context } = request.body; //Available variables: aiHistory

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: preprocessorContext + "\nContext:\n" + JSON.stringify(context) },
                { role: "user", content: userInput }
            ],
            response_format: { type: "json_object" }
        });

        if (!aiResponse.choices || !aiResponse.choices[0].message) {
            throw new Error("Invalid AI response structure.");
        }

        const action = typeof aiResponse.choices[0].message.content === "string"
            ? JSON.parse(aiResponse.choices[0].message.content)
            : aiResponse.choices[0].message.content;

        
        console.log("PREPROCESSOR GENERATED ACTION: ", action)

        switch (action.action_type) {
            case "modify_ticket":
                return await modifyTicketProcessor(request.body);
            case "create_ticket":
                return await createTicketProcessor(action, request.body);
            case "create_many_tickets":
                return await createManyTicketsProcessor(action, request.body);
            case "create_goal":
                return await createGoalProcessor(action, request.body);
            case "delete_ticket":
                return await deleteGoalProcessor(action);
            case "delete_goal":
                return await deleteGoalProcessor(action);
            case "request_info":
                return await requestInfoProcessor(action);
            case "provide_answer":
                return await provideAnswerProcessor(action, request.body);
            case "provide_advice":
                return await provideAdviceProcessor(action, request.body);
            case "error":
                return { action_type: "error", status: "error", message: `error in PREprocessor || Ara said: congrats you were either being cute or you broke the ground || You said: ${userInput} || The machine said: ${action.message}` };
            case "fatal error":
                return { action_type: "error", status: "error", message: action.message }
            default:
                throw new Error(`Unknown action_type: ${action.action_type}`);
        }
    } catch (error) {
        console.error("[Preprocessor Error]:", error.message);
        return { status: "error", message: error.message };
    }
};

module.exports = preprocessor;