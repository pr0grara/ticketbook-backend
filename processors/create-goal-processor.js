const fs = require("fs");
const path = require("path");
const { openai } = require("../util/ai_util");
const createGoal = require("../action-handlers/create-goal");
const createTicket = require("../action-handlers/create-ticket");
const { dateTimeNow } = require("./processor-util/processor-util");

const createGoalProcessorPath = path.join(__dirname, "./processor-util/create-goal-instructions.txt");
const createGoalInstructions = fs.readFileSync(createGoalProcessorPath, "utf-8"); // Read as string

async function createGoalProcessor(action, reqBody, createType) {
    try {
        const { isGoal, isBucket } = createType;
        const { userInput, userId } = reqBody;
        console.log("[createGoalProcessor] Received:", { action, userInput, userId });

        const systemMessage = `
            userId: ${userId}
            shortcut: ${action?.shortcut ? "true" : "false"}
            isDefinitelyGoal: ${createType?.isGoal ? "true" : "false"}
            isDefinitelyBucket: ${createType?.isBucket ? "true" : "false"}

            ${createGoalInstructions}
            ${dateTimeNow}
        `

        // console.log(systemMessage);
        // Step 1: Call AI to refine the goal creation request
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userInput }
            ],
            response_format: { type: "json_object" }
        });

        if (!aiResponse.choices || !aiResponse.choices[0].message) {
            throw new Error("Invalid AI response structure.");
        }

        const response = JSON.parse(aiResponse.choices[0].message.content);
        console.log("[createGoalProcessor] AI Response:", response);
        if (response.error) return { action_type: "error", status: "error", message: response.error, type: "CREATE_GOAL" }

        
        // Step 2: Extract `generate_tickets` and remove it before saving the goal
        const { generate_tickets, ...goalData } = response;

        const savedGoal = await createGoal(goalData, createType);

        // if (savedGoal)

        // Step 3: If tickets were suggested, call create-ticket.js for each one
        let newTickets = [];
        if (Array.isArray(generate_tickets) && generate_tickets.length > 0) {
            console.log(`[createGoalProcessor] Generating ${generate_tickets.length} tickets...`);
            for (const ticket of generate_tickets) {
                const ticketData = {
                    ...ticket,
                    goalId: savedGoal.newGoal._id, // Link ticket to the newly created goal
                    userId: savedGoal.newGoal.userId,
                    status: "pending"
                };
                let newTicket = await createTicket(ticketData);
                newTickets.push(newTicket)
            }
        }

        return { action_type: `create_goal`, isBucket: savedGoal.newGoal?.isBucket ? true : false, status: "completed", message: `New ${savedGoal.newGoal?.isBucket ? 'Bucket' : 'Goal'} created.`, newGoal: savedGoal.newGoal, newTickets };

    } catch (error) {
        console.error("[createGoalProcessor Error]:", error.message);
        return { status: "fatal_error", message: error.message };
    }
}

module.exports = createGoalProcessor;