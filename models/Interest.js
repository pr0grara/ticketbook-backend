const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InterestSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: false },
    authorId: { type: String, required: true },
    date: { type: Date, default: Date() },
});

const Interest = mongoose.model("interest", InterestSchema);

module.exports = Interest;