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

    
    lockUntil: { type: Date },

    
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    
    refreshTokenHash: { type: String, default: null },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    employmentStatus: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
