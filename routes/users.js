const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { idGenerator } = require('../util/util');
const Feedback = require('../models/Feedback');

router.get('/', (req, res) => {
    res.status(200).send('user route home').end();
})

router.post('/new', (req, res) => {
    const { firstname, email, password } = req.body;
    const saltRounds = 10; // Higher is more secure but slower

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json(err).end();
        const newUser = new User({
            firstname,
            email,
            hash
        })
        newUser.save()
            .then(data => res.status(200).json(data).end())
            .catch(err => console.log(err))    
    });
});

router.patch('/update-tickets-order', async (req, res) => {
    try {
        const { userId, newTickets } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(userId),
            { $set: { tickets: newTickets } },
            { new: true }
        )
        console.log(updatedUser)

        if (!updatedUser) return res.status(404).json({ message: "User not found" }).end()
        return res.status(200).json(updatedUser.tickets).end();
    } catch (e) {
        res.status(500).json({ message: "Error updating user:", e }).end();
    }
})

router.get("/watched-tutorial/status/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        return res.status(200).json({watchedTutorial: user.watchedTutorial || false}).end(); 
    } catch (e) {
        return res.status(500).json({ error: "Could not access tutorial status" }).end();
    }
})

router.post("/mark-tutorial-watched", async (req, res) => {
    try {
        const { userId, watched } = req.body; // or use JWT/cookie
        await User.updateOne({ _id: userId }, { watchedTutorial: watched });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Could not update tutorial status." });
    }
});

router.post("/feedback", async (req, res) => {
    const {userId, userFeedback} = req.body;
    // if (!userId) return res.status(400).send('User ID not provided');
    if (!userFeedback) return res.status(400).send('User Feedback not provided');

    const feedback = new Feedback({
        // userId,
        userFeedback
    })

    feedback.save()
        .then(() => res.status(200).send('Thank you for your feedback').end())
        .catch(err => res.status(500).json(err).end());
})

router.post("/set-viewed-summary", async (req, res) => {
    const userId = req.body.userId;
    User.findByIdAndUpdate(userId, {viewedSummary: true})
        .then(() => res.status(200).send('user viewed summary status changed'))
        .catch(() => res.status(500).send("error changing viewed summary status"))

})

module.exports = router;