const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sensitivity: { type: String, default: "Public" }, 
    allowedUsers: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            permissions: [String] 
        }
    ]
});

module.exports = mongoose.model("Resource", resourceSchema);
