const mongoose = require("mongoose");
const crypto = require("crypto");

const auditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    resource: String,
    resourceId: String,
    ip: String,
    userAgent: String,
    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success"
    },
    details: String
}, { timestamps: true });


auditLogSchema.pre("save", function(next) {
    if (this.details) {
        const cipher = crypto.createCipher("aes-256-cbc", process.env.JWT_SECRET);
        this.details = cipher.update(this.details, "utf8", "hex") + cipher.final("hex");
    }
    next();
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
