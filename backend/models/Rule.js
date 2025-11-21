const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema(
  {
    allowedDays: [String],
    startTime: String, // HH:MM 24h
    endTime: String,
    allowedDepartments: [String],
    allowedRoles: [String],
    allowedLocations: [String],
    allowedIps: [String],
    requireMfa: { type: Boolean, default: false },
    minClearanceLevel: {
      type: String,
      enum: ["Public", "Internal", "Confidential", "TopSecret"],
    },
    maxLeaveDaysWithoutApproval: Number,
    minLeaveDays: Number,
  },
  { _id: false }
);

const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    effect: { type: String, enum: ["allow", "deny"], default: "deny" },
    priority: { type: Number, default: 100 },
    enabled: { type: Boolean, default: true },
    conditions: conditionSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rule", ruleSchema);

