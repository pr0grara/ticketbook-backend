const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const { toZonedTime } = require('date-fns-tz');
const { isSameDay } = require('date-fns');

const TIMEZONE = 'America/Los_Angeles';

// Helper to check same local day
function isSameLocalDay(a, b) {
    const zonedA = toZonedTime(a, TIMEZONE);
    const zonedB = toZonedTime(b, TIMEZONE);
    return isSameDay(zonedA, zonedB);
}

cron.schedule('0 2 * * *', async () => {
    const now = new Date();
    const localNow = toZonedTime(now, TIMEZONE);
    console.log(`🕑 [Smart Scheduling] Sweep running at ${localNow.toString()}`);

    try {
        const tickets = await Ticket.find({
            $or: [
                { setToday: { $exists: true, $ne: null } },
                { setSoon: { $exists: true, $ne: null } }
            ]
        });

        console.log(`🔍 Found ${tickets.length} tickets with setToday/setSoon...`);

        for (const ticket of tickets) {
            let update = {};
            const { _id, setToday, setSoon } = ticket;

            if (!ticket.doToday && setToday) {
                const same = isSameLocalDay(setToday, localNow);
                update.doToday = same;
            }

            if (!ticket.doSoon && setSoon) {
                const same = isSameLocalDay(setSoon, localNow);
                update.doSoon = same;
            }

            await Ticket.findByIdAndUpdate(_id, { $set: update });
        }

        console.log(`✅ Smart scheduling completed for ${tickets.length} tickets`);
    } catch (err) {
        console.error('❌ Smart scheduling error:', err);
    }
}, { timezone: TIMEZONE });