const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const baseLogicPath = path.join(__dirname, 'ai_instructions', 'ai_base_logic.txt'); // Path to file
const baseLogic = fs.readFileSync(baseLogicPath, 'utf-8'); // Read as string
const actionTypesPath = path.join(__dirname, 'ai_instructions', 'action_types.txt'); // Path to file
const actionTypes = fs.readFileSync(actionTypesPath, 'utf-8'); // Read as string
const dailyPlanPath = path.join(__dirname, 'ai_instructions', 'daily_plan.txt'); // Path to file
const dailyPlanInstructions = fs.readFileSync(dailyPlanPath, 'utf-8'); // Read as string
const userInputPath = path.join(__dirname, 'ai_instructions', 'user_input.txt');
const userInputInstructions = fs.readFileSync(userInputPath, 'utf-8'); // Read as string
const conversationContaxtPath = path.join(__dirname, 'ai_instructions', 'conversation_context.txt');
const conversationContext = fs.readFileSync(conversationContaxtPath, 'utf-8'); // Read as string

const ai_input_system_context = "KEEP ANSWERS SHORT. 2 lines MAX. You are an intelligent assistant for a productivity app called TicketBook. Your role is to help users break down goals into actionable tasks (tickets), prioritize their work, optimize workflows, and provide strategic guidance. Users may ask you to: Generate new tickets for a goal, Prioritize or suggest which tasks should be completed first, Consolidate, merge, or restructure existing tasks, Offer strategic advice on how to complete tasks efficiently, Break down complex goals into smaller, manageable steps, Detect redundant or overlapping tasks and suggest optimizations. RULES: Always analyze existingTickets (if provided) to avoid redundancy (Do not suggest duplicate tasks), find relationships between tasks and suggest efficient sequencing, and merge or refine tasks where necessary. Provide structured and actionable insights—each response should be clear, practical, and relevant. If the user asks for prioritization, consider urgency, dependencies, and workload distribution. Think strategically—offer workflow optimizations rather than just listing tasks."
const daily_plan_system_context = "You are an AI productivity assistant for the TicketBook app. Your task is to help users plan their day efficiently by organizing their tasks (tickets) into a structured daily schedule.\n Users may provide a primary goal they are focusing on, a list of tasks (tickets) with priorities, estimated time, deadlines, and dependencies, and optional user preferences such as preferred focus time or break schedules.\n Your job is to analyze these inputs and generate an optimized work schedule that balances urgency, focus time, and efficiency.\n\n Guidelines for Task Assignment:\n 1. Prioritize critical tasks first. High-priority and time-sensitive tasks should come early in the day.\n 2. Batch small tasks together. Group quick wins (tasks under 10 minutes) to avoid context switching.\n 3. Respect dependencies. Ensure prerequisite tasks are completed before dependent tasks.\n 4. Account for mental energy levels. Deep-focus tasks should be scheduled in high-energy periods (e.g., morning).\n 5. Balance workload across the day."

const createAIInstructions =  (request) => {
    const { userInput, context, requestType, from, conversation, aiHistory } = request;
    // console.log("context goals", context.goals)

    let systemMessage = `You are an AI productivity assistant for TicketBook. Always respond in JSON format. Do not include Markdown formatting or any additional text outside of a valid JSON object.`;

    switch (requestType) {
        case "user message":
            systemMessage = baseLogic + "\nHere are all action types:\n" + actionTypes;
            break
        case "prioritize":
            systemMessage += "Analyze the user's tasks and return them ranked from most to least urgent.";
            break;
        case "consolidate":
            systemMessage += "Look for redundant or related tasks and combine them for efficiency.";
            break;
        case "suggest":
            systemMessage += "Generate new, actionable tasks that align with the user's goal.";
            break;
        case "daily plan":
            systemMessage += dailyPlanInstructions;
            break;
        default:
            systemMessage += "Assist the user in structuring and optimizing their work.";
    };

    // console.log(systemMessage)
    const allTickets = context.allTickets;
    
    const existingTickets = allTickets.filter(ticket => ticket.status !== "done");
    const completedTickets = allTickets.filter(ticket => ticket.status === "done");

    const messages = [
        {
            role: "system",
            content: `
            ${systemMessage}
            
            Goal(s): 
            ${context.goals.map(goal => `Title: ${goal.goal}\nDescription: ${goal.description}\ngoalId: ${goal.goalId}`)}

            Active Tickets:
            ${existingTickets.map(ticket => `- [${ticket.priority}] ${ticket.task} (${ticket.status}, ${ticket._id})`).join("\n")}

            Completed Tickets:
            ${completedTickets ? completedTickets.map(ticket => `- ✅ ${ticket.task}`).join("\n") : "None"}

            The user message was taken from a ${from === "from_calendar" ? "A CALENDAR WIDGET" : "A GOALS WIDGET"}.
            
            Today is ${Date()}! When a user requests a deadline like 'tomorrow' or 'Friday', always return an explicit date in YYYY-MM-DD format. 
            If time is not specified, default to 12:00PM.
        `
        },
        ...aiHistory.interactions.map(entry => [
            { role: "user", content: entry.userMessage },
            { role: "assistant", content: entry.aiResponse }
        ]).flat(), //Correctly formats AI history
        { role: "user", content: `User Message: ${userInput}` }
    ]

    // Only add the user message if userInput exists
    if (userInput && userInput.trim() !== "") {
        messages.push({ role: "user", content: userInput });
    }

    return messages;

};

module.exports = { openai, ai_input_system_context, daily_plan_system_context, createAIInstructions, dailyPlanInstructions };