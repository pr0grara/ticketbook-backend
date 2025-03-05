require("dotenv").config()
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

const authenticateUser = (req, res, next) => {
    const token = req.cookies.authToken; // Read token from cookie
    // console.log("authenticateUser TOKEN: ", token)

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = authenticateUser;
