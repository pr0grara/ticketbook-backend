require("dotenv").config();
const express = require("express");
const bcrypt = require('bcrypt');
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JWT_SECRET = process.env.JWT_SECRET;
const User = require('../models/User');
const authenticateUser = require("../util/authUtil");

const router = express.Router();
// console.log(process.env.G_CAL_CLIENT_ID)
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

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })

        console.log("process.env.PROD_ENV: ", process.env.PROD_ENV)
        console.log("process.env.PROD_ENV === 'true': ", process.env.PROD_ENV === "true")
        
        if (!user) return res.status(401).json({ error: "Invalid username or password" });
        
        const isMatch = bcrypt.compareSync(password, user.hash)
        if (!isMatch) return res.status(401).json({ error: "Invalid username or password" });

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
        // console.log("Setting Cookie: ", token);
        
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.PROD_ENV === "true",
            sameSite: process.env.PROD_ENV === "true" ? "None" : "Lax",
            domain: process.env.PROD_ENV === "true" ? "api.arabuilds.com" : "localhost",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        console.log("Set-Cookie Header Sent:", res.getHeaders()["set-cookie"]);
        
        res.status(200).json({ success: true, userId: user._id }).end();
    } catch {
        return res.status(500).json({ error: "Internal server error" }).end();
    };
})

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie("authToken", { 
        httpOnly: true, 
        secure: process.env.PROD_ENV === "true",
        sameSite: process.env.PROD_ENV === "true" ? "None" : "Lax", 
    });
    res.status(200).json({ message: "Logged out successfully" });
});

// Status
router.get('/status', (req, res) => {
    const token = req.cookies.authToken; // Read token from cookie

    if (!token) {
        return res.status(200).json({ loggedIn: false }); // Graceful response
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ loggedIn: true, user: decoded });
    } catch (error) {
        return res.status(200).json({ loggedIn: false }); // Expired/Invalid token, still return loggedIn: false
    }
});


router.get('/auth-check', (req, res) => {
    const token = req.cookies.authToken; // Extract token from HTTP-only cookie

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ user: decoded });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
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
