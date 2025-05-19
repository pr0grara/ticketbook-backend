const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');
const Behavior = require('../models/Behavior');
const DailySummary = require('../models/DailySummary');
const { openai } = require("../util/ai_util");
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const behaviorContextPath = path.join(__dirname, "../util/ai_instructions/behavior.txt")
const behaviorSystemMessage = fs.readFileSync(behaviorContextPath, "utf-8");
// const summarizeBehavior = require('../services/summarizeBehavior'); // <-- your AI summary function

const TIMEZONE = 'America/Los_Angeles';

cron.schedule('0 3 * * *', async () => { //run at 3:00 AM
    const now = moment().tz(TIMEZONE);
    const yesterdayStart = now.clone().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = now.clone().subtract(1, 'day').endOf('day').toDate();
    console.log(`🔍 Running behavior summary sweep for ${yesterdayStart.toISOString()} - ${yesterdayEnd.toISOString()}`);
    
    try {
        const date = moment().tz('America/Los_Angeles').subtract(1, 'day').startOf('day').toDate();
        console.log(date);
        const behaviors = await Behavior.find({
            createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
        });

        if (!behaviors.length) {
            console.log('No behaviors found for yesterday.');
            return;
        }

        const userBehaviorsMap = behaviors.reduce((acc, behavior) => {
            if (!acc[behavior.userId]) acc[behavior.userId] = [];
            acc[behavior.userId].push(behavior);
            return acc;
        }, {});

        // console.log(userBehaviorsMap)
        const summaryInput = {
            yesterday: {},
            today: {},
            upcoming: {}
        }

        for (const [userId, userBehaviors] of Object.entries(userBehaviorsMap)) {
            console.log(`📋 Summarizing behaviors for user: ${userId} (${userBehaviors.length} entries)`);

            summaryInput["yesterday"] = userBehaviors.map(b => ({
                type: b.type,
                action: b.ticketType || b.goalType,
                ticketId: b.ticketId,
                goalId: b.goalId,
                title: b.title,
                notes: b.notes
            }));
            const todaysTickets = await Ticket.find({userId, doToday: true, status: "pending"})
            summaryInput["today"] = todaysTickets.map(t => ({
                title: t.title,
                text: t.text,
                isQuickWin: t.isQuickWin,
                isDeepFocus: t.isDeepFocus,
                isRecurring: t.isRecurring
            }));
            const upcomingTickets = await Ticket.find({ userId, doSoon: true, status: "pending" })
            summaryInput["upcoming"] = upcomingTickets.map(t => ({
                title: t.title,
                text: t.text,
                isQuickWin: t.isQuickWin,
                isDeepFocus: t.isDeepFocus,
                isRecurring: t.isRecurring
            }));

            // console.log(summaryInput.yesterday);

            const aiSummary = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: behaviorSystemMessage },
                    { role: "user", content: JSON.stringify(summaryInput) }
                ],
                response_format: { type: "json_object" }
            });

            if (!aiSummary.choices || !aiSummary.choices[0].message) {
                throw new Error("Invalid AI response structure.");
            }

            const summary = typeof aiSummary.choices[0].message.content === "string"
                ? JSON.parse(aiSummary.choices[0].message.content)
                : aiSummary.choices[0].message.content;

            // You can log, store, or emit this summary as needed
            // console.log(`✅ Summary for ${userId}:\n${JSON.stringify(summary)}\n`);

            const newSummary = new DailySummary({
                userId,
                summary,
                date
            })

            newSummary.save()
                .then(() => {
                    console.log(`Daily Summary for ${userId} saved`)
                    User.findByIdAndUpdate(userId, {viewedSummary: false})
                        .then(()=>console.log('set viewedSummary to false'))
                        .catch(e => console.log(e))
                })
                .catch(e => console.log("error saving daily summary: ", e));
        }

        console.log('🎉 Behavior summarization complete');
    } catch (err) {
        console.error('❌ Error during behavior summary sweep:', err);
    }
}, { timezone: TIMEZONE });