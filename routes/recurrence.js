// Backend route: /routes/tickets.js (or wherever your ticket routes live)

const express = require('express');
const router = express.Router();
const RecurrenceDispatcherModel = require('../models/RecurrenceDispatcher');
const Tickets = require('../models/Ticket');
const RecurrenceDispatcher = require('../services/RecurrenceDispatcher');

router.post('/trigger-recurrence', async (req, res) => {
    try {
        const userId = req.body.userId;

        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        // Step 1: Get all COMPLETED tickets for this user
        const completedTickets = await Tickets.find({
            userId,
            status: 'done'
        });

        // Step 2: Find any dispatchers tied to those tickets
        const ticketIds = completedTickets.map(t => t._id);
        const dispatchers = await RecurrenceDispatcherModel.find({
            ticketId: { $in: ticketIds },
            status: 'active'
        });

        let reactivated = [];

        for (const rawDispatcher of dispatchers) {
            const dispatcher = new RecurrenceDispatcher(rawDispatcher);
            if (!dispatcher.shouldTriggerToday()) continue;

            // Reactivate the ticket
            const originalTicket = completedTickets.find(t => t._id.equals(dispatcher.ticketId));
            if (!originalTicket) continue;

            await Tickets.findByIdAndUpdate(dispatcher.ticketId, {
                $set: {
                    status: 'pending',
                    // Optional: reset checklist items here
                    // checklist: originalTicket.checklist.map(item => ({ ...item, status: 'unchecked' }))
                }
            });

            await RecurrenceDispatcherModel.findByIdAndUpdate(dispatcher._id, {
                $set: { lastGeneratedDate: new Date() }
            });

            reactivated.push(dispatcher.ticketId);
        }

        return res.status(200).json({ reactivated });
    } catch (err) {
        console.error('❌ Recurrence trigger error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/add-recurrence', async (req, res) => {
    const {
        ticketId,
        repeatInterval,
        startDate,
        endDate,
        occurrencePattern,
        onCompletionBehavior,
        lastGeneratedDate,
        status
    } = req.body;

    try {
        const newRecurrence = new RecurrenceDispatcherModel({
            ticketId,
            repeatInterval,
            startDate,
            endDate,
            occurrencePattern,
            onCompletionBehavior,
            lastGeneratedDate,
            status
        });

        // Save the new dispatcher
        const savedRecurrence = await newRecurrence.save();

        // Mark ticket as recurring
        await Tickets.findByIdAndUpdate(ticketId, {
            $set: { isRecurring: true }
        });

        // Delete any other recurrence dispatchers for this ticket (except the one we just saved)
        await RecurrenceDispatcherModel.deleteMany({
            ticketId,
            _id: { $ne: savedRecurrence._id }
        });

        return res.status(200).send('Recurring schedule set!').end();
    } catch (err) {
        console.error('❌ Error in /add-recurrence:', err);
        return res.status(500).json(err).end();
    }
});

router.delete('/delete-recurrence', (req, res) => {
    const { ticketId } = req.body;
    RecurrenceDispatcherModel.findOneAndDelete({ticketId})
        .then(() => {
            return Tickets.findByIdAndUpdate(ticketId, {
                $set: { isRecurring: false }
            });        
        })
        .then(() => res.status(200).send('Recurrence deleted!').end())
        .catch(err => res.status(500).json(err).end())
})

module.exports = router;