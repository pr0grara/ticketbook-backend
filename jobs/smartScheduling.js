const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const { toZonedTime } = require('date-fns-tz');
const { isSameDay, isBefore } = require('date-fns');

const TIMEZONE = 'America/Los_Angeles';

cron.schedule('0 2 * * *', async () => {
    const now = toZonedTime(new Date(), TIMEZONE);
    console.log(`Running smart scheduling sweep at ${now.toLocaleString("en-US", { timeZone: TIMEZONE })}`);

    try {
        const tickets = await Ticket.find({
            $or: [
                { setToday: { $exists: true, $ne: null } },
                { setSoon: { $exists: true, $ne: null } }
            ]
        });

        console.log(`Found ${tickets.length} ticket(s) with scheduling info`);

        for (const ticket of tickets) {
            const update = {};

            const setToday = ticket.setToday ? toZonedTime(new Date(ticket.setToday), TIMEZONE) : null;
            const setSoon = ticket.setSoon ? toZonedTime(new Date(ticket.setSoon), TIMEZONE) : null;

            if (!ticket.doToday) update.doToday = setToday && (isSameDay(setToday, now) || isBefore(setToday, now));
            if (!ticket.doSoon) update.doSoon = setSoon && (isSameDay(setSoon, now) || isBefore(setSoon, now));

            console.log(`Ticket: ${ticket.title} | doToday: ${update.doToday} | doSoon: ${update.doSoon}`);

            await Ticket.findByIdAndUpdate(ticket._id, { $set: update });
        }

        console.log(`Smart scheduling complete`);
    } catch (err) {
        console.error('Smart scheduling error:', err);
    }
}, { timezone: TIMEZONE });