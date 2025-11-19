const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const allowRoles = require("../middleware/rbac");
const AuditLog = require("../models/AuditLog");
const crypto = require("crypto");

router.get("/", protect, allowRoles("Admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    const decryptedLogs = logs.map(log => {
      if (log.details) {
        try {
          const decipher = crypto.createDecipher("aes-256-cbc", process.env.JWT_SECRET);
          let decrypted = decipher.update(log.details, "hex", "utf8");
          decrypted += decipher.final("utf8");
          log.details = decrypted;
        } catch (e) {
          log.details = "[Encrypted]";
        }
      }
      return log;
    });

    res.json(decryptedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;