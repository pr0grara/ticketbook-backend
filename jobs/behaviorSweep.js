const cron = require('node-cron');
const moment = require('moment-timezone');
const Behavior = require('../models/Behavior');
// const summarizeBehavior = require('../services/summarizeBehavior'); // <-- your AI summary function

const TIMEZONE = 'America/Los_Angeles';

cron.schedule('* * * * *', async () => {
    const now = moment().tz(TIMEZONE);
    const yesterdayStart = now.clone().subtract(0, 'day').startOf('day').toDate();
    const yesterdayEnd = now.clone().subtract(0, 'day').endOf('day').toDate();

    console.log(`🔍 Running behavior summary sweep for ${yesterdayStart.toISOString()} - ${yesterdayEnd.toISOString()}`);

    try {
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

        console.log(userBehaviorsMap)

        for (const [userId, userBehaviors] of Object.entries(userBehaviorsMap)) {
            console.log(`📋 Summarizing behaviors for user: ${userId} (${userBehaviors.length} entries)`);

            const summaryInput = userBehaviors.map(b => ({
                type: b.type,
                action: b.ticketType || b.goalType,
                ticketId: b.ticketId,
                goalId: b.goalId,
                title: b.title,
                notes: b.notes
            }));

            console.log(summaryInput);

            // 👇 Replace this with your real AI summary function
            const aiSummary = await fakeAISummary(summaryInput);

            // You can log, store, or emit this summary as needed
            console.log(`✅ Summary for ${userId}:\n${aiSummary}\n`);
        }

        console.log('🎉 Behavior summarization complete');
    } catch (err) {
        console.error('❌ Error during behavior summary sweep:', err);
    }
}, { timezone: TIMEZONE });

// Placeholder AI summary function
async function fakeAISummary(data) {
    return `User did ${data.length} things. Example: ${JSON.stringify(data[0])}`;
}