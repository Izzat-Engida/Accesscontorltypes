const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: { type: String, unique: true, required: true },

    password: { type: String, required: true },

    role: {
        type: String,
        enum: ["Admin", "HR_Manager", "Finance_Manager", "Manager", "Employee"],
        default: "Employee",
    },

    department: {
        type: String,
        enum: ["HR", "Finance", "IT", "Sales", "General"],
        default: "General",
    },

    clearanceLevel: {
        type: String,
        enum: ["Public", "Internal", "Confidential", "TopSecret"],
        default: "Internal",
    },

    failedAttempts: { type: Number, default: 0 },

    accountLocked: { type: Boolean, default: false },

    // FIXED field name
    lockUntil: { type: Date },

    // MFA / OTP fields
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },

    mfaEnabled: { type: Boolean, default: false },
    refreshTokenHash: { type: String, default: null },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    employmentStatus: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
