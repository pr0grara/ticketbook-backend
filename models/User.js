const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname: { type: String, required: true },
    email: { type: String, required: false },
    hash: { type: String, required: true },
    watchedTutorial: { type: Boolean, default: false },
    date: { type: Date, default: Date() },
    forceReload: { type: Boolean, default: false }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;