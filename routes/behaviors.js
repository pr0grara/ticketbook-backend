const express = require('express');
const moment = require('moment-timezone');
const router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User');
const Behavior = require('../models/Behavior');
const DailySummary = require('../models/DailySummary');

router.get('/', (req, res) => {
    res.status(200).send('behaviors route home').end();
})

router.post('/new', (req, res) => {
    try {
        
    } catch (e) {
    }
});

router.get('/fetch-for-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const behaviors = await Behavior.find({ userId });
        
        // const startOfYesterday = moment().tz('utc').subtract(2, 'day').startOf('day').toDate();
        // const endOfYesterday = moment().tz('utc').subtract(2, 'day').endOf('day').toDate();
        // console.log(startOfYesterday, endOfYesterday)

        const targetDate = moment().tz('America/Los_Angeles').subtract(1, 'day').startOf('day').toDate();
        // console.log(targetDate)
        const dailySummary = await DailySummary.findOne({
            userId,
            date: targetDate
            // date: { $gte: startOfYesterday, $lte: endOfYesterday }
        });
        // console.log(dailySummary)
        res.status(200).json({behaviors, dailySummary});
    } catch (e) {
        console.error('Error fetching behaviors:', e);
        res.status(500).json({ error: 'Failed to fetch behaviors' });
    }
});


module.exports = router;