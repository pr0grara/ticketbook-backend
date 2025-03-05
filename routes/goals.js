const express = require('express');
const router = express.Router();
const authenticateUser = require('../util/authUtil');

const Goal = require('../models/Goal');

const { idGenerator, oneYearFromNow } = require('../util/util');

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

router.post('/foruser', authenticateUser, (req, res) => {
    let userId = req.body.userId;
    console.log("fetch goals by userId", userId)

    Goal.find({ userId, })
        .then(data => res.status(200).json(data).end)
        .catch(err => res.status(404).send(err).end())
})

router.delete('/delete/:goalId', (req, res) => {
    let { goalId } = req.params;

    Goal.findOneAndDelete({ _id: goalId })
        .then(data => res.status(200).send('deleted').end())
        .catch(err => res.status(400).send(`error deleting: ${err}`).end());
});

module.exports = router;