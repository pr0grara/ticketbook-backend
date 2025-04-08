const fs = require("fs");
const path = require("path");
const Error = require('../models/Error');
const { openai } = require("../util/ai_util");
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
const {handleAction} = require("./processor-util/preprocessor-util.js");
const { summarizeChat, formatTickets, formatGoals, generateUserMessage } = require("./processor-util/processor-util.js");

// const preprocessorContextPath = path.join(__dirname, "../util/ai_instructions/preprocessor.txt");
const preprocessorContextPath = path.join(__dirname, "./processor-util/preprocessorTest.txt");
const preprocessorContext = fs.readFileSync(preprocessorContextPath, "utf-8"); // Read as string

const preprocessor = async (request) => {
    try {
        const { userInput, context, conversation } = request.body;
        const { shortcut } = request.body.context;
        let action;

        const chatSummary = summarizeChat(conversation)

        const openTickets = context.allTickets.filter(t => t.status !== "done");
        const closedTickets = context.allTickets.filter(t => t.status === "done");
        const formattedOpenTickets = formatTickets(openTickets);
        const formattedClosedTickets = formatTickets(closedTickets);
        
        const formattedGoals = formatGoals(context.goals);

        const systemMessage = `
${preprocessorContext}

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
        `.trim();

        const userMessage = generateUserMessage({chatSummary, formattedOpenTickets, formattedGoals, userInput})        

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
                    { role: "system", content: systemMessage },
                    { role: "user", content: userMessage }
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

        return await handleAction(action, request, userMessage)
        // switch (action.action_type) {
        //     case "modify_ticket":
        //         return await modifyTicketProcessor(request.body);
        //     case "create_ticket":
        //         return await createTicketProcessor(action, request.body);
        //     case "create_many_tickets":
        //         return await createManyTicketsProcessor(action, request.body);
        //     case "create_goal":
        //         return await createGoalProcessor(action, request.body, { isGoal: true });
        //     case "create_bucket":
        //         return await createGoalProcessor(action, request.body, { isBucket: true });
        //     case "delete_ticket":
        //         return await deleteGoalProcessor(action);
        //     case "delete_goal":
        //         return await deleteGoalProcessor(action);
        //     case "request_info":
        //         return await requestInfoProcessor(action);
        //     case "provide_answer":
        //         return await provideAnswerProcessor(action, request.body);
        //     case "provide_advice":
        //         return await provideAdviceProcessor(action, request.body);
        //     case "clarification_needed":
        //         return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" }
        //     case "error":
        //         return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" };
        //     case "fatal error":
        //         return { action_type: "error", status: "error", message: action.message, type: "PREPROCESSOR" }
        //     default:
        //         throw new Error(`Unknown action_type: ${action.action_type}`);
        // }
    } catch (error) {
        console.error("[Preprocessor Error]:", error.message);
        return { status: "error", message: error.message };
    }
};

module.exports = preprocessor;