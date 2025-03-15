require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// const {google} = require('googleapis');
// const oAuth2Client= new google.auth.OAuth2(process.env.G_CAL_CLIENT_ID, process.env.G_CAL_SECRET_KEY, process.env.REDIRECT);
const { OAuth2Client } = require("google-auth-library");
const bodyParser = require('body-parser')
const session = require('express-session');
const { CORS_ORIGINS } = require('./CONFIG.js');
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 5000;
const app = express();

const ticketsRoutes = require('./routes/tickets');
const usersRoutes = require('./routes/users');
const ideasRoutes = require('./routes/ideas');
const goalsRoutes = require('./routes/goals');
const calendarRoutes = require('./routes/calendar');
const aiRoutes = require('./routes/ai');
const interestsRoute = require('./routes/interests');
const authRoutes = require('./routes/authRoutes');

// const { scrapeLinkedIn } = require('./pupeteer.js')

const cors = require("cors");
const corsOptions = {
    origin: CORS_ORIGINS,
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,  // ✅ Required for cookies
};
app.use(cors(corsOptions));

app.use(cookieParser());

// app.options("*", cors(corsOptions)); // ✅ Allow preflight for all routes
app.use((req, res, next) => {
    const origin = req.headers.origin; // 🔍 Get the request's origin

    if (CORS_ORIGINS.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin); // ✅ Allow this origin
    }

    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

mongoose.connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    console.log("connected to MongoDB")
    );


app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ limit: '50mb' }));


//Initialize express-session
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret", // Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.PROD_ENV === "true", // Set to true if using HTTPS
        httpOnly: true,// Prevents frontend JavaScript from accessing cookies
        sameSite: process.env.PROD_ENV === "true" ? "None" : "Lax" // Allows cookies in cross-origin requests
     } 
}));

app.get('/', (req, res) => {
    res.status(200).send('ticketbook home').end();
})

app.get('/api', (req, res) => {
    res.status(200).send('ticketbook api home').end();
})

// app.get('/scrape', async (req, res) => {
//     const rawData = await scrapeLinkedIn();
//     console.log(rawData);
//     res.status(200).json(rawData).end();
// })

app.use('/api/tickets', ticketsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`ticketbook listening on port ${PORT}`)
    console.log("Running Node.js version:", process.version);
});