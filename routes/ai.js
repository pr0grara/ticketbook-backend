const express = require("express");
const axios = require("axios");
const router = express.Router();
const OpenAI = require('openai');
const {ai_input_system_context, daily_plan_system_context, createAIInstructions} = require('../util/ai_util');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

router.post("/input", async (req, res) => {
    try {
        const { query, goal } = req.body;
        if (!query) {
            return res.status(400).json({ message: "Query is required." });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: ai_input_system_context },
                { role: "user", content: `The goal is ${goal}` + query }
            ],
            temperature: 0.7,
        });

        // console.log(req.body, response.choices[0])
        res.json({ response: response.choices[0].message.content });

    } catch (error) {
        console.error("AI API Error:", error, req.body);
        res.status(500).json({ response: "⚠️ AI service is unavailable. Try again later." });
    }
});

router.post("/goal_breakdown", async (req, res) => {
    try {
        const { goal, description, existingTickets } = req.body;
        if (!goal) {
            return res.status(400).json({ message: "Goal is required." });
        }
        // return
        // ✅ Proper async/await usage
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an intelligent assistant for a productivity app called TicketBook. Your job is to help users break down their goals into actionable tasks (tickets). Each task should be clear, concise, and relevant to the user's goal. Your job is to break down goals into structured, JSON-formatted tasks (tickets). Respond **ONLY** in valid JSON format without Markdown (no ```json or ```).\nIt is also very important to examine existingTickets (if provided) so as A) to not suggest redundant tickets and B) to examine the relationships between them and find synergy" },
                {
                  role: "user", content: `Goal: ${goal}\nDescription (if provided): ${description}\nExisiting Tasks: ${existingTickets}\nProvide 4 actionable items or "tickets" in JSON format.\nReturn an OBJECT EXACTLY like this:
                  [
                    {
                        "text": "First small step toward the goal",
                        "priority": "LOW",// "MED", or "HIGH"
                    },
                    {
                        "text": "Another important step",
                        "priority": "LOW",// "MED", or "HIGH"
                    },
                    ETC...
                  ]` 
                }
            ],
            // response_format: "json",
            temperature: 0.7,
        });
        let filteredResponse = response.choices[0].message.content.replace(/```json|```/g, "").trim();
        // console.log(response.choices[0].message.content)

        res.json({ response: filteredResponse });

    } catch (error) {
        console.error("AI API Error:", error);
        res.status(500).json({ response: "⚠️ AI service is unavailable. Try again later." });
    }
});

router.post('/daily_plan', async (req, res) => {
    try {
        const { tickets, goal } = req.body;

        //Proper async/await usage
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: daily_plan_system_context },
                { role: "user", content: `The goal is ${goal}` + `and the tickets are ${JSON.stringify(tickets)}` }
            ],
            temperature: 0.7,
        });

        res.json({ response: response.choices[0].message.content });

    } catch (error) {
        console.error("AI API Error:", error, req.body);
        res.status(500).json({ response: "⚠️ AI service is unavailable. Try again later." });
    }
});

router.post('/advise-ticket', async (req, res) => {
    const { userInput, context, requestType } = req.body;
    // console.log("CONTEXT: ", context)
    const sytemMessage = `You are an AI assistant for a productivity app. The user 
    has asked for help with the existing ticket:
    ${JSON.stringify(context.allTickets[0])}
    Which belongs to a bigger picture goal:
    ${JSON.stringify(context.goals[0])}
    Please provide 1-3 sentences of advice. Your response MUST be in JSON format and
    should look like this:
    {
        action_type: "provide_advice",
        ticketId: "string",
        advice: "your advice goes here"
    }`
    const messages = [
        {
            role: "system",
            content: sytemMessage
        }
    ]
    // console.log(sytemMessage);

    const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" }
    })
    const cleanedRes = aiResponse.choices[0].message.content;
    res.status(200).json({response: cleanedRes}).end();
}) 

router.post('/request', async (req, res) => {
    try {
        const { userInput, context, requestType, aiHistory, conversation } = req.body;        
        const instructions = createAIInstructions({userInput, context, requestType, conversation, aiHistory}); //HUGELY IMOPORTANT FUNCTION
        console.log(JSON.stringify(instructions))
        // console.log()
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: instructions,
            response_format: { type: "json_object" }
        });

        let result;
        switch (requestType) {
            case "user message":
                result = { response: response.choices[0].message.content };
                break;
            case "prioritize":
                result = { response: response.choices[0].message.content };
                break;
            case "generate_tickets":
                result = { suggestions: JSON.parse(response.choices[0].message.content) };
                break;
            case "consolidate":
                result = { mergedTickets: JSON.parse(response.choices[0].message.content) };
                break;
            case "daily plan":
                result = { response: response.choices[0].message.content };
                break
            default:
                result = { response: "Unknown request type" };
        }
        console.log(result);
        res.json(result);
    } catch (error) {
        console.error("AI API Error:", error);
        res.status(500).json({ error: "AI service is unavailable" });
    }
})

module.exports = router;
