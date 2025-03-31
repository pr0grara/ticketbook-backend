const mongoose = require("mongoose");

const ErrorSchema = new mongoose.Schema({
    errorType: { type: String, enum: ["SERVER", "CLIENT"] },
    serverError: { type: Object },
    processorError: { type: String, enum: ["PREPROCESSOR", "CREATE_TICKET", "CREATE_MANY_TICKETS", "MODIFY_TICKET", "CREATE_GOAL", "PROVIDE_ADVICE", "PROVIDE_ANSWER", "UNKNOWN"] },
    userInput: { type: String }, //If relevant
    context: { type: Object }, //If relevant
    userId: { type: String }, // Added if the error bubbles to frontend
    clientError: { type: Object },
    clientType: { type: String, enum: ["AICanvas", "Goal", "Ticket", "Login", "Navbar"] }
}, { timestamps: true });

const Error = mongoose.model("Error", ErrorSchema);

module.exports = Error;