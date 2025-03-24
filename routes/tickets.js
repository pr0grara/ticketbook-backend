const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket'); 

const { idGenerator, oneYearFromNow } = require('../util/util');

// const User = require('../models/User');
// const updateAllTickets = async () => {
//     const users = await User.find({});
//     console.log(users)
//     for (const user of users) {
//         const tickets = await Ticket.find({userId: user._id});
//         // console.log(tickets)
        
//         for (let i = 0; i < (await tickets).length; i++) {
//             tickets[i].order = i + 1
//             await tickets[i].save();
//         }
//         console.log(`✅ Updated orders for user ${user.firstname}`);
//     }
// }

// //updateAllTickets()

router.get('/', (req, res) => {
    res.status(200).send('ticket route home').end();
})

router.get('/byGoal/:goalId', async (req, res) => {
    // console.log(req.params)
    try {
        const { goalId } = req.params;
        console.log("fetch tickets by goalId", goalId)
        const tickets = await Ticket.find({ goalId: goalId });  // Fetch tickets linked to goalId
        // const tickets = await Ticket.find({ userId }).sort({ order: 1 }); //Sorted by order field
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
    let { title, userId, goalId, text, status, priority, priorityWeight, depends_on, deadline, checklist, notes } = req.body;

    let newTicket = new Ticket({
        userId,
        goalId,
        title,
        text,
        status,
        priority,
        priorityWeight,
        checklist,
        notes,
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

        if (!["pending", "in-progress", "done"].includes(status)) {
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

        if (!["pending", "in-progress", "done"].includes(priority)) {
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

router.patch("/update/:ticketId", async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { text, status, priority, deadline, title, notes, checklist, doToday, doSoon } = req.body.ticket;
        // console.log(ticketId, JSON.stringify(req.body))
        const updateFields = {text, status, priority, deadline, title, notes, checklist, doToday, doSoon}
        console.log(ticketId, updateFields);
        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, updateFields, { new: true });

        if (!updatedTicket) {
            return res.status(404).json({ message: "Ticket not found or improperly updated" });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.patch("/update-order/:userId", async (req, res) => {
    const { userId } = req.params;
    const { newTickets } = req.body;
    console.log(newTickets)

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" }).end();
    }

    try {
        // Create an object mapping ticket IDs to their new order values
        let updateOrderObject = {};
        newTickets.forEach((ticket, idx) => {
            updateOrderObject[ticket._id] = ticket.order ?? idx; // Assign `idx` if order is missing
        });

        console.log("🔄 Order Updates:", updateOrderObject);

        // Find all tickets for the user
        const tickets = await Ticket.find({ userId });

        if (!tickets.length) {
            return res.status(404).json({ message: "No tickets found for user" }).end();
        }

        // Prepare bulk update operations
        const bulkOps = tickets.map(ticket => ({
            updateOne: {
                filter: { _id: ticket._id },
                update: { $set: { order: updateOrderObject[ticket._id] } }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Ticket.bulkWrite(bulkOps);
            // console.log(result)
            const updatedTickets = {tickets}
            
            const newTickets = await Ticket.find({ userId })
                .sort({ order: 1 })
                .collation({ locale: "en", numericOrdering: true })
                .lean();

            console.log(`✅ Updated ${result.modifiedCount} tickets`);
            res.status(200).json(newTickets).end();
        } else {
            console.log("⚠️ No updates needed");
            res.status(200).send("No tickets needed updating").end();
        }
    } catch (e) {
        console.error("❌ Error updating tickets:", e);
        res.status(500).json({ message: "Error updating tickets", error: e }).end();
    }
});

router.delete('/delete/:ticketId', (req, res) => {
    let { ticketId } = req.params;

    Ticket.findOneAndDelete({ _id: ticketId })
        .then(data => res.status(200).send('deleted').end())
        .catch(err => res.status(400).send(`error deleting: ${err}`).end());
});

router.patch('/add-title', async (req, res) => {
    const tickets = await Ticket.find();
    // console.log(tickets);
    let ticketsObj = {};
    tickets.forEach(ticket => {
        ticketsObj[ticket._id] = {
            title: "",
            text: ticket.text
        };
    });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `Your job is to analyze a tickets Object and return a 
                copy with the title key populated. Analyze the text field and 
                create a shortened title. Note that some ticket texts are already 
                short enough to be read by a human in short hand; in these cases 
                simply populate the title field with the existing text.

                YOU MUST RETURN A JSON OBJECT!!!

                Here is the tickets object to modify:
                ${JSON.stringify(ticketsObj)}
                `
            }
        ],
        response_format: { type: "json_object" }
    });

    let titledTickets = JSON.parse(response.choices[0].message.content);
    let ticketIDs = Object.keys(titledTickets);

    ticketIDs.forEach(id => {
        Ticket.findById(id)
            .then(ticket => {
                ticket.title = titledTickets[id].title;
                ticket.save()
            })
            .catch(e => console.log(e))
    });
    
    res.status(200).json(JSON.parse(response.choices[0].message.content)).end();
})

module.exports = router;