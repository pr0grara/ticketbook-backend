const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const Error = require('../models/Error');

router.get('/', (req, res) => {
    res.status(200).send('error route home').end();
})

router.post("/log-client-error", async (req, res) => {
    try {
        let error = Error.findByIdAndUpdate(req.body.errorId, )
        await Error.create({
            errorType: "CLIENT",
            clientType: req.body.clientType || "unknown",
            clientError: req.body.error,
            userId: req.body.userId || null,
            userInput: req.body.userInput || null,
            context: req.body.context || null
        });
        res.status(201).send("Logged");
    } catch (err) {
        res.status(500).send("Failed to log client error");
    }
});

module.exports = router;