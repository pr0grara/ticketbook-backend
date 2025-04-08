const express = require("express");
const axios = require("axios");
const router = express.Router();
const OpenAI = require('openai');
const {ai_input_system_context, dailyPlanInstructions, createAIInstructions} = require('../util/ai_util');
const preprocessor = require("../processors/preprocessor");
const Error = require('../models/Error');

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

router.post('/daily-plan', async (req, res) => {
    try {
        console.log(dailyPlanInstructions)
        const { allTickets, goals } = req.body.context;

        //Proper async/await usage
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: dailyPlanInstructions },
                { role: "user", content: `My goal(s) are ${JSON.stringify(goals, null, 2)}` + `and my tickets are ${JSON.stringify(allTickets, null, 2)}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        console.log(response.choices[0])

        res.json({ response: response.choices[0].message.content });

    } catch (error) {
        console.error("AI API Error:", error, req.body);
        res.status(500).json({ response: "⚠️ AI service is unavailable. Try again later." });
    }
});

router.post('/advise-ticket', async (req, res) => {
    const { context, requestType } = req.body;
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

//key function
router.post('/request', async (req, res) => {
    try {
        const t1 = Date.now();
        const processedResponse = await preprocessor(req);
        const t2 = Date.now();
        const processorTime = ((t2 - t1) / 1000).toFixed(1);
        console.log("USER INPUT: ", req.body?.userInput)
        console.log("PROCESSING TIME: ", parseFloat(processorTime), "s")

        // console.log("🔍 Preprocessor Output:", processedResponse);

        // ✅ Immediately return if preprocessor completed the task
        if (processedResponse.status) {
            if (processedResponse.status === "error") {
                let newError = new Error({
                    errorType: "SERVER",
                    serverError: processedResponse,
                    processorError: processedResponse.type || "UNKNOWN",
                    userInput: req.body.userInput,
                    context: req.body.context,
                    userId: req.body.userId
                })
                await newError.save();
            }
            return res.status(200).json({ response: processedResponse }).end();
        }

        // ✅ Handle unexpected cases where no valid action is determined
        if (!processedResponse.action_type) {
            return res.status(200).json({
                response: {
                    action_type: "provide_advice",
                    advice: "I'm not sure how to process this request."
                }
            }).end();
        }

        console.error("⚠️ Unexpected flow reached:", processedResponse);
        return res.status(500).json({ error: "Unexpected error in request routing" });

    } catch (error) {
        console.error("❌ Request Processing Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
