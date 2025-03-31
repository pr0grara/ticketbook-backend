const Error = require('../models/Error');

const errorLogger = async (err, req, res, next) => {
    try {
        await Error.create({
            errorType: "SERVER",
            clientType: req.headers["x-client-type"] || "unknown",
            serverError: {
                message: err.message,
                name: err.name,
                stack: err.stack,
            },
            clientError: null,
            userInput: req.body?.userInput || null,
            context: req.body?.context || null,
            userId: req.body?.userId || null,
        });
        console.log("Server Error Logged")
    } catch (loggingError) {
        console.error("❌ Failed to log error:", loggingError);
    }

    next(err);
};

module.exports = errorLogger;