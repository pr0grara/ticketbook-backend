require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const oAuth2Client = new google.auth.OAuth2(process.env.G_CAL_CLIENT_ID, process.env.G_CAL_SECRET_KEY, process.env.REDIRECT);
const router = express.Router();

router.get('/', (req, res) => {
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    res.redirect(url);
    // console.log(url)
});

router.get('/redirect', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oAuth2Client.getToken(code); // Get tokens
        oAuth2Client.setCredentials(tokens); // Store tokens in OAuth client
        // Optionally, store tokens in session or database
        req.session.tokens = tokens; // Save to session (if using express-session)

        // ✅ Redirect to frontend with auth confirmation
        res.redirect(`http://localhost:3000/calendar?auth=success`);
    } catch (err) {
        console.error("Error retrieving tokens:", err);
        res.redirect(`http://localhost:3000/login?auth=failure`);
    }
});


// router.get('/events', async (req, res) => {
//     try {
//         const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
//         const response = await calendar.calendarList.list({});
//         const calendars = response.data.items;
//         res.status(200).json(calendars);
//     } catch (err) {
//         console.error("Error fetching calendars:", err);
//         res.status(500).json({ error: err.message }); // ✅ Send error as JSON, not as raw object
//     }
// });

router.get('/events', async (req, res) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const response = await calendar.events.list({
            calendarId: "primary",  // Fetch events from the user's main calendar
            timeMin: new Date().toISOString(), // Only fetch upcoming events
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = response.data.items || [];
        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

module.exports = router;