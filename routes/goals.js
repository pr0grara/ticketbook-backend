const express = require('express');
const router = express.Router();
const authenticateUser = require('../util/authUtil');

const Goal = require('../models/Goal');
const Ticket = require('../models/Ticket');

const { idGenerator, oneYearFromNow } = require('../util/util');
const User = require('../models/User');

router.get('/', (req, res) => {
    res.status(200).send('goal route home').end();
})

router.post('/new', (req, res) => {
    let [userId, category, title, priority, description, progress, parentGoal, subGoals, tickets, deadline] = [req.body.userId, req.body.category, req.body.title, req.body.priority, req.body.description, req.body.progress, req.body.parentGoal, req.body.subGoals, req.body.tickets, req.body.deadline]
    // console.log(req.body)
    let newGoal = new Goal({
        userId,
        category,
        title,
        priority,
        description,
        progress,
        parentGoal,
        subGoals,
        tickets,
        deadline: deadline || oneYearFromNow,
    })
    newGoal.save()
        .then(data => res.status(200).json(data).end())
        .catch(err => {
            console.log(err)
            res.status(404).json(err).end();
        });
});

router.get('/byid/:goalId', authenticateUser, (req, res) => {
    const { goalId } = req.params;
    Goal.findById(goalId)
        .then(goal => res.status(200).json(goal).end())
        .catch(err => res.status(401).json({error: "could not find goal by id"}).end())
})

router.post('/foruser', authenticateUser, async (req, res) => {
    let userId = req.body.userId;
    console.log("fetch goals by userId", userId)

    let user = await User.findById(userId)

    Goal.find({ userId })
        .then(data => {
            if (!!user.forceReload) {
                user.forceReload = false;
                user.save()
                    .then(() => res.status(200).json({ forceReload: true }).end())
                    .catch(err => console.log(err))
            } else {
                res.status(200).json(data).end()
            }
        })
        .catch(err => res.status(404).send(err).end())
})

router.delete('/delete/:goalId', async (req, res) => {
    try {
        const { goalId } = req.params;

        // Step 1: Capture IDs and delete all tickets associated with the goal
        const deletedTickets = await Ticket.find({ goalId }).select('_id');
        await Ticket.deleteMany({ goalId });

        // Step 2: Delete the goal itself
        const deletedGoal = await Goal.findByIdAndDelete(goalId);

        if (!deletedGoal) {
            return res.status(404).send('Goal not found').end();
        }

        res.status(200).send({
            status: "deleted",
            message: 'Goal and associated tickets deleted successfully',
            deletedGoalId: goalId,
            deletedTicketIds: deletedTickets.map(ticket => ticket._id), }).end();
    } catch (err) {
        console.log(err)
        res.status(500).send(`Error deleting goal and tickets: ${err.message}`).end();
    }
});

module.exports = router;