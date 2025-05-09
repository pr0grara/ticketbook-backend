const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const { isSameDay, isBefore } = require('date-fns');
const moment = require('moment-timezone');

const TIMEZONE = 'America/Los_Angeles';

cron.schedule('0 2 * * *', async () => {
    const zonedNow = moment(new Date()).tz('America/Los_Angeles').format()
    console.log(`Running smart scheduling sweep at ${zonedNow}`);

    try {
        const tickets = await Ticket.find({
            $or: [
                { setToday: { $exists: true, $ne: null } },
                { setSoon: { $exists: true, $ne: null } }
            ]
        });

        console.log(`Found ${tickets.length} ticket(s) with scheduling info`);

        for (const ticket of tickets) {
            const zonedToday = moment(ticket.setToday).tz('America/Los_Angeles').format();
            const zonedSoon = moment(ticket.setSoon).tz('America/Los_Angeles').format();

            const update = {};

            if (!ticket.doToday && ticket.setToday) update.doToday = (isSameDay(zonedToday, zonedNow) || isBefore(zonedToday, zonedNow));
            if (!ticket.doSoon && ticket.setSoon) update.doSoon = (isSameDay(zonedSoon, zonedNow) || isBefore(zonedNow, zonedNow));

            console.log(`Ticket: ${ticket.title} | doToday: ${update.doToday} | doSoon: ${update.doSoon}`);

            await Ticket.findByIdAndUpdate(ticket._id, { $set: update });
        }

        console.log(`Smart scheduling complete`);
    } catch (err) {
        console.error('Smart scheduling error:', err);
    }
}, { timezone: TIMEZONE });