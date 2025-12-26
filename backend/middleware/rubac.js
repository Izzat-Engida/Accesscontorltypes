const asyncHandler = require("express-async-handler");
const { logaudit } = require("../utils/auditLogger");
const { evaluateRules } = require("../utils/ruleEngine");

const rubac = (resource, action) =>
  asyncHandler(async (req, res, next) => {
    const context = buildContext(req);
    const { decision, rule } = await evaluateRules(resource, action, context);
    
    if (req.user?.role === "Admin") {
      return next();
    }

    if (decision === "allow" || decision === "not_applicable") {
      return next();
    }

 
    await logaudit({
      userId: req.user?._id || null,
      action: "Rule denied access",
      resource,
      resourceId: context.resourceId || null,
      ip: context.ip,
      status: "failed",
      details: `RuBAC rule "${rule?.name || "unknown"}" blocked action "${action}"`,
      category: "security",
      severity: "medium",
    });

    return res.status(403).json({
      message: "Access denied by security policy",
      rule: rule?.name || "unknown",
    });
  });

function buildContext(req) {
  return {
    user: req.user,
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
    location: req.headers["x-client-location"],
    time: new Date(),
    resourceId: req.params?.id,
    payload: req.body || {},
  };
}

module.exports = rubac;