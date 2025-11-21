const mongoose = require("mongoose");
const crypto = require("crypto");

const auditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    resource: String,
    resourceId: String,
    ip: String,
    userAgent: String,
    category: {
        type: String,
        enum: ["user", "system", "security", "permission"],
        default: "user"
    },
    severity: {
        type: String,
        enum: ["info", "low", "medium", "high", "critical"],
        default: "info"
    },
    status: {
        type: String,
        enum: ["success", "failed"],
        default: "success"
    },
    details: String
}, { timestamps: true });

auditLogSchema.pre("save", function(next) {
    if (this.details) {
        const keySource = process.env.LOG_ENCRYPTION_KEY || process.env.JWT_SECRET || "log-secret";
        const key = crypto.createHash("sha256").update(keySource).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
        const encrypted = Buffer.concat([cipher.update(this.details, "utf8"), cipher.final()]);
        const tag = cipher.getAuthTag();
        this.details = `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
    }
    next();
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
