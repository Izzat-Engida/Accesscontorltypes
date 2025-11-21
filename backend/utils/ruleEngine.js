const Rule = require("../models/Rule");
const { compareClearance, isIpAllowed } = require("./policyDecisionPoint");

const evaluateRules = async (resource, action, context = {}) => {
  const rules = await Rule.find({ resource, action, enabled: true }).sort({ priority: 1 });
  if (!rules.length) {
    return { decision: "not_applicable" };
  }

  for (const rule of rules) {
    if (conditionsMatch(rule.conditions, context)) {
      return { decision: rule.effect, rule };
    }
  }

  return { decision: "not_applicable" };
};

const conditionsMatch = (conditions = {}, context = {}) => {
  const { user, ip, location, time = new Date(), payload = {} } = context;
  if (!user) return false;

  if (conditions.allowedRoles?.length && !conditions.allowedRoles.includes(user.role)) return false;
  if (conditions.allowedDepartments?.length && !conditions.allowedDepartments.includes(user.department)) return false;
  if (conditions.allowedLocations?.length && location && !conditions.allowedLocations.includes(location)) return false;

  if (conditions.allowedDays?.length) {
    const day = time.toLocaleString("en-US", { weekday: "short" });
    if (!conditions.allowedDays.includes(day)) return false;
  }

  if (conditions.startTime && conditions.endTime) {
    const current = time.toTimeString().slice(0, 5);
    if (current < conditions.startTime || current > conditions.endTime) return false;
  }

  if (conditions.allowedIps?.length && !isIpAllowed(ip, conditions.allowedIps)) return false;

  if (conditions.requireMfa && !user.mfaEnabled) return false;

  if (
    conditions.minClearanceLevel &&
    compareClearance(user.clearanceLevel, conditions.minClearanceLevel) < 0
  ) {
    return false;
  }

  if (
    typeof conditions.maxLeaveDaysWithoutApproval === "number" &&
    typeof payload.days === "number" &&
    payload.days > conditions.maxLeaveDaysWithoutApproval
  ) {
    return false;
  }

  if (
    typeof conditions.minLeaveDays === "number" &&
    typeof payload.days === "number" &&
    payload.days < conditions.minLeaveDays
  ) {
    return false;
  }

  return true;
};

module.exports = { evaluateRules };

