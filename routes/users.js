const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { idGenerator } = require('../util/util');

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

module.exports = router;