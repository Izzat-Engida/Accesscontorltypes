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

    const keySource = process.env.LOG_ENCRYPTION_KEY || process.env.JWT_SECRET || "log-secret";
    const key = crypto.createHash("sha256").update(keySource).digest();

    const decryptedLogs = logs.map(log => {
      const logObj = log.toObject(); // Important: work on plain object

      if (logObj.details) {
        try {
          const [ivHex, tagHex, encryptedHex] = logObj.details.split(":");

          if (!ivHex || !tagHex || !encryptedHex) {
            logObj.details = "[Invalid Format]";
          } else {
            const iv = Buffer.from(ivHex, "hex");
            const tag = Buffer.from(tagHex, "hex");
            const encrypted = Buffer.from(encryptedHex, "hex");

            const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, null, "utf8");
            decrypted += decipher.final("utf8");

            logObj.details = decrypted;
          }
        } catch (error) {
          console.error("Decryption error for log:", log._id, error.message);
          logObj.details = "[Decryption Failed]";
        }
      }

      return logObj;
    });

    res.json(decryptedLogs);
  } catch (err) {
    console.error("Audit log fetch error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;