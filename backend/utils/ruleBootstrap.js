const Rule = require("../models/Rule");
const { logSystemEvent } = require("./auditLogger");

const defaultRules = [
  {
    name: "System access business hours",
    resource: "system_access",
    action: "login",
    effect: "allow",
    priority: 10,
    conditions: {
      allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "08:00",
      endTime: "18:00",
    },
  },
  {
    name: "System access deny fallback",
    resource: "system_access",
    action: "login",
    effect: "deny",
    priority: 1000,
  },
  {
    name: "Leave approval >10 days allow HR",
    resource: "leave_request",
    action: "approve",
    effect: "allow",
    priority: 5,
    conditions: {
      allowedRoles: ["HR_Manager", "Admin"],
      minLeaveDays: 11,
    },
  },
  {
    name: "Leave approval >10 days deny others",
    resource: "leave_request",
    action: "approve",
    effect: "deny",
    priority: 6,
    conditions: {
      minLeaveDays: 11,
    },
  },
  {
    name: "Leave approvals office hours",
    resource: "leave_request",
    action: "approve",
    effect: "allow",
    priority: 7,
    conditions: {
      allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "08:00",
      endTime: "17:00",
    },
  },
  {
    name: "Leave approvals deny fallback",
    resource: "leave_request",
    action: "approve",
    effect: "deny",
    priority: 8,
  },
];

const ensureDefaultRules = async () => {
  for (const rule of defaultRules) {
    await Rule.findOneAndUpdate({ name: rule.name }, rule, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  await logSystemEvent("Baseline RuBAC rules ensured");
};

module.exports = { ensureDefaultRules };

