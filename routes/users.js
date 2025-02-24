const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', (req, res) => {
    res.status(200).send('user route home').end();
})

router.post('/new', (req, res) => {
    let newUser = new User({
        id: "1",
        firstname: "ARA",
        email: "azbaghda@gmail.com",
    })

    newUser.save()
        .then(data => res.status(200).json(data).end())
        .catch(err => console.log(err))
});

module.exports = router;