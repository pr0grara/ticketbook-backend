const express = require('express');
const router = express.Router();

const Ticket = require('../models/Ticket'); 

const { idGenerator, oneYearFromNow } = require('../util/util');

router.get('/', (req, res) => {
    res.status(200).send('ticket route home').end();
})

router.get('/byGoal/:goalId', async (req, res) => {
    // console.log(req.params)
    try {
        const { goalId } = req.params;
        console.log("fetch tickets by goalId", goalId)
        const tickets = await Ticket.find({ goalId: goalId });  // Fetch tickets linked to goalId
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Error fetching tickets", error });
    }
});

router.get('/byUser/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("fetch tickets by userId", userId)
        const tickets = await Ticket.find({ userId: userId });  // Fetch tickets linked to userId
        // console.log(tickets)
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Error fetching tickets", error });
    }
});

router.post('/new', (req, res) => {
    let { userId, goalId, text, status, priority, priorityWeight, depends_on, deadline } = req.body;
    console.log(deadline)

    let newTicket = new Ticket({
        userId,
        goalId,
        text,
        status,
        priority,
        priorityWeight,
        depends_on,
        deadline: deadline || oneYearFromNow,
    })

    newTicket.save()
        .then(data => res.status(200).json(data).end())
        .catch(err => {
            console.log(err)
            res.status(500).json(err).end();
        });
});

router.patch("/:ticketId/updateStatus", async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        console.log(ticketId, status)

        if (!["pending", "in-progress", "done"].includes(status)) {
            console.log('failed here')
            return res.status(400).json({ message: "Invalid status" });
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });

        if (!updatedTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.patch("/:ticketId/updatePriority", async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { priority } = req.body;
        console.log(ticketId, priority)

        if (!["pending", "in-progress", "done"].includes(priority)) {
            console.log('failed here')
            return res.status(400).json({ message: "Invalid priority" });
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { priority }, { new: true });

        if (!updatedTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.patch("/:ticketId/update", async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { text, status, priority, deadline } = req.body.ticket;
        // console.log(ticketId, JSON.stringify(req.body))

        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { text, status, priority, deadline }, { new: true });

        if (!updatedTicket) {
            return res.status(404).json({ message: "Ticket not found or improperly updated" });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete('/delete/:ticketId', (req, res) => {
    let { ticketId } = req.params;

    Ticket.findOneAndDelete({ _id: ticketId })
        .then(data => res.status(200).send('deleted').end())
        .catch(err => res.status(400).send(`error deleting: ${err}`).end());
})

module.exports = router;