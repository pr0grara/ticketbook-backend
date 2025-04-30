// Backend job: /jobs/recurrenceSweep.js

const cron = require('node-cron');
const RecurrenceDispatcherModel = require('../models/RecurrenceDispatcher');
const TicketModel = require('../models/Ticket');
const RecurrenceDispatcher = require('../services/RecurrenceDispatcher');

// Run daily at 1:00 AM server time
cron.schedule('0 1 * * *', async () => {
// cron.schedule('* * * * *', async () => {
    console.log(`[RECURRENCE SWEEP] Triggered at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);

    try {
        const dispatchers = await RecurrenceDispatcherModel.find({ status: 'active' });

        for (const rawDispatcher of dispatchers) {
            const dispatcher = new RecurrenceDispatcher(rawDispatcher);

            if (!dispatcher.shouldTriggerToday()) continue;

            const ticket = await TicketModel.findById(dispatcher.ticketId);
            if (!ticket || ticket.status !== 'done') continue;

            // Reactivate the existing ticket
            const update = {
                status: 'pending'
            };

            // Optional: reset checklist if it exists
            if (Array.isArray(ticket.checklist)) {
                update.checklist = ticket.checklist.map(item => ({
                    ...item,
                    status: 'unchecked'
                }));
            }

            await TicketModel.findByIdAndUpdate(ticket._id, { $set: update });

            // Update dispatcher's lastGeneratedDate
            await RecurrenceDispatcherModel.findByIdAndUpdate(dispatcher._id, {
                $set: { lastGeneratedDate: new Date() }
            });

            console.log(`✅ Reactivated recurring ticket: ${ticket.title}`);
        }
    } catch (err) {
        console.error('❌ Error during recurrence sweep:', err);
    }
}, {timezone: 'America/Los_Angeles'});