const express = require('express');
const router = express.Router();
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

module.exports = router;