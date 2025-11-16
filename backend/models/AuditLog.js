const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    ip: String,
    timestamp: { type: Date, default: Date.now },
    details: Object
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
