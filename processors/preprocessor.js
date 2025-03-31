const fs = require("fs");
const path = require("path");
const Error = require('../models/Error');
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
        const { userInput, context } = request.body;
        const { shortcut } = request.body.context;
        let action;
  
        if (!!shortcut) {
            switch (shortcut) {
                case 'New Ticket':
                        action = { action_type: "create_ticket", shortcut: true }
                        break
                    case 'New Goal':
                        action = { action_type: "create_goal", shortcut: true }
                        break
                    case 'New Bucket':
                        action = { action_type: "create_bucket", shortcut: true }
                        break
            }
        } else {
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
    
            action = typeof aiResponse.choices[0].message.content === "string"
                ? JSON.parse(aiResponse.choices[0].message.content)
                : aiResponse.choices[0].message.content;
    
            console.log("PREPROCESSOR GENERATED ACTION: ", action)
        }

        switch (action.action_type) {
            case "modify_ticket":
                return await modifyTicketProcessor(request.body);
            case "create_ticket":
                return await createTicketProcessor(action, request.body);
            case "create_many_tickets":
                return await createManyTicketsProcessor(action, request.body);
            case "create_goal":
                return await createGoalProcessor(action, request.body, { isGoal: true });
            case "create_bucket":
                return await createGoalProcessor(action, request.body, { isBucket: true });
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
            case "clarification_needed":
                return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" }
            case "error":
                return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" };
            case "fatal error":
                return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" }
            default:
                throw new Error(`Unknown action_type: ${action.action_type}`);
        }
    } catch (error) {
        console.error("[Preprocessor Error]:", error.message);
        return { status: "error", message: error.message };
    }
};

module.exports = preprocessor;