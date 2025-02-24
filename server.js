require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// const {google} = require('googleapis');
// const oAuth2Client= new google.auth.OAuth2(process.env.G_CAL_CLIENT_ID, process.env.G_CAL_SECRET_KEY, process.env.REDIRECT);
const { OAuth2Client } = require("google-auth-library");
const bodyParser = require('body-parser')
const session = require('express-session');
const { CORS_ORIGINS } = require('./config.js');

const PORT = process.env.PORT || 5000;
const app = express();

console.log("CORS ORIGINS:", CORS_ORIGINS)

const ticketsRoutes = require('./routes/tickets');
const usersRoutes = require('./routes/users');
const ideasRoutes = require('./routes/ideas');
const goalsRoutes = require('./routes/goals');
const calendarRoutes = require('./routes/calendar');
const aiRoutes = require('./routes/ai');
const interestsRoute = require('./routes/interests');
const authRoutes = require('./routes/authRoutes');

const cors = require("cors");
app.use(cors({
    origin: CORS_ORIGINS, // Allow only frontend
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
}));

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
        secure: false, // Set to true if using HTTPS
        httpOnly: true,// Prevents frontend JavaScript from accessing cookies
        sameSite: "lax" // Allows cookies in cross-origin requests
     } 
}));

app.get('/', (req, res) => {
    res.status(200).send('ticketbook home').end();
})

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