require("dotenv").config();
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { google } = require("googleapis");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const router = express.Router();
console.log(process.env.G_CAL_CLIENT_ID)
// OAuth Client
const oAuth2Client = new google.auth.OAuth2(
    process.env.G_CAL_CLIENT_ID,
    process.env.G_CAL_SECRET_KEY,
    process.env.REDIRECT
);

// Configure Passport.js
passport.use(new GoogleStrategy({
    clientID: process.env.G_CAL_CLIENT_ID,
    clientSecret: process.env.G_CAL_SECRET_KEY,
    callbackURL: process.env.REDIRECT,
}, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((obj, done) => { done(null, obj); });

router.use(passport.initialize());
router.use(passport.session());

// Redirect User to Google OAuth
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"]
}));

// Callback Route After Google Login
router.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/dashboard"); // Redirect to frontend dashboard
    }
);

// Logout
router.get("/logout", (req, res) => {
    req.logout(() => {
        req.session.destroy();
        res.redirect("/");
    });
});

// Status
router.get('/status', (req, res) => {
    if (req.session.tokens) {
        console.log("Session Data on Status Check:", req.session.tokens); // ✅ Debugging
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// Protected Route: Fetch Google Calendar Events
router.get("/calendar/events", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    oAuth2Client.setCredentials({ access_token: req.user.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    try {
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
        });
        res.json(response.data.items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Protected Route: Create Google Calendar Event
router.post("/calendar/events", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    oAuth2Client.setCredentials({ access_token: req.user.accessToken });

    const { summary, location, description, startTime, endTime } = req.body;
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    try {
        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary,
                location,
                description,
                start: { dateTime: startTime, timeZone: "America/New_York" },
                end: { dateTime: endTime, timeZone: "America/New_York" },
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
