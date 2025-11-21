const path = require("path");
const fs = require("fs/promises");
const cron = require("node-cron");
const User = require("../models/User");
const Document = require("../models/Document");
const Policy = require("../models/Policy");
const AuditLog = require("../models/AuditLog");
const { logSystemEvent } = require("./auditLogger");

const backupDir = path.join(__dirname, "..", "..", "backups");

async function runBackup() {
  await fs.mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const payload = {
    timestamp,
    users: await User.find().lean(),
    documents: await Document.find().lean(),
    policies: await Policy.find().lean(),
    logs: await AuditLog.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).lean(),
  };
  const file = path.join(backupDir, `backup-${timestamp}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  await logSystemEvent(`Backup created at ${file}`);
}

function scheduleBackups() {
  const schedule = process.env.BACKUP_CRON || "0 2 * * *";
  cron.schedule(schedule, runBackup, { timezone: process.env.BACKUP_TZ || "Etc/UTC" });
}

module.exports = { scheduleBackups, runBackup };

