const Document = require("../models/Document");
const { logaudit } = require("../utils/auditLogger");
const { compareClearance } = require("../utils/policyDecisionPoint");

const dacProtect = (permission = "read") => {
  return async (req, res, next) => {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Document not found" });

      const isOwner = doc.owner.toString() === req.user._id.toString();
      const shared = doc.sharedWith.find((s) => s.user.toString() === req.user._id.toString());
      const hasPermission = shared && (shared.permission === permission || shared.permission === "write");
      const clearanceAllows = compareClearance(req.user.clearanceLevel, doc.sensitivityLevel) >= 0;

      if (permission === "read" && clearanceAllows) {
        return next();
      }

      if (!clearanceAllows) {
        await logaudit({
          userId: req.user._id,
          action: "MAC/DAC denied",
          resource: "Document",
          resourceId: doc._id.toString(),
          ip: req.ip,
          status: "failed",
          severity: "medium",
          details: `Insufficient clearance (${req.user.clearanceLevel}) for ${doc.sensitivityLevel}`,
        });
        return res.status(403).json({ message: "Insufficient clearance" });
      }

      if (isOwner || hasPermission) {
        return next();
      }

      await logaudit({
        userId: req.user._id,
        action: "DAC denied",
        resource: "Document",
        resourceId: doc._id.toString(),
        ip: req.ip,
        status: "failed",
        details: `Missing ${permission} permission`,
      });
      res.status(403).json({ message: "dac: Access denied" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = { dacProtect };