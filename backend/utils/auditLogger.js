const AuditLog = require("../models/AuditLog");
const { sendSecurityAlert } = require("./alertService");

const logaudit = async ({
  userId,
  action,
  resource,
  resourceId,
  ip,
  userAgent,
  status = "success",
  details,
  category = "user",
  severity = "info",
}) => {
  try {
    const log = await AuditLog.create({
      user: userId || null,
      action,
      resource,
      resourceId,
      ip,
      userAgent,
      status,
      category,
      severity,
      details: details || null,
    });

    if (severity === "high" || severity === "critical" || category === "system") {
      await sendSecurityAlert(
        `Security event: ${action}`,
        `Status: ${status}\nResource: ${resource}\nDetails: ${details || "N/A"}`
      );
    }

    return log;
  } catch (err) {
    console.error("audit log failed: ", err.message);
  }
};

const logSystemEvent = (details) =>
  logaudit({
    action: "System event",
    resource: "System",
    status: "success",
    category: "system",
    severity: "low",
    details,
  });

module.exports = { logaudit, logSystemEvent };