const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");
const { dacProtect } = require("../middleware/dac");
const abacProtect = require("../middleware/abac");
const rubac = require("../middleware/rubac");

const Document = require("../models/Document");
const User = require("../models/User");
const { logaudit } = require("../utils/auditLogger");
const { compareClearance } = require("../utils/policyDecisionPoint");

// -------------------- PROFILE --------------------
router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshTokenHash");
  res.json({ message: "User profile fetched", user });
});


router.get(
  "/hr-finance",
  protect,
  allowRoles("HR_Manager", "Finance_Manager", "Admin"),
  async (req, res) => {
    const payrollRecords = await Document.find({ type: "payroll" });
    res.json({ message: "HR & Finance data", payrollRecords });
  }
);


router.get("/confidential", protect, macProtect("Confidential"), async (req, res) => {
  const reports = await Document.find({ sensitivityLevel: "Confidential" }).lean();
  res.json({ message: "Confidential data fetched", reports });
});

const classificationLevels = ["Public", "Internal", "Confidential", "TopSecret"];


router.get("/documents", protect, async (req, res) => {
  const allowedLevels = classificationLevels.filter(
    (level) => compareClearance(req.user.clearanceLevel, level) >= 0
  );

  const baseQuery =
    req.user.role === "Admin"
      ? {}
      : {
          $or: [
            { owner: req.user._id },
            { "sharedWith.user": req.user._id },
            { sensitivityLevel: { $in: allowedLevels } },
          ],
        };

  const documents = await Document.find(baseQuery)
    .populate("owner", "name email role")
    .populate("sharedWith.user", "name email role")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ documents });
});

router.get("/documents/:id", protect, dacProtect("read"), async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate("owner", "name email role")
    .populate("sharedWith.user", "name email role");
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (compareClearance(req.user.clearanceLevel, doc.sensitivityLevel) < 0) {
    return res.status(403).json({ message: "Insufficient clearance for this document" });
  }
  await logaudit({
    userId: req.user._id,
    action: "Document viewed",
    resource: "Document",
    resourceId: req.params.id,
    ip: req.ip,
    status: "success",
    category: "permission",
  });
  res.json({ message: "Document fetched", document: doc });
});

router.put("/documents/:id", protect, dacProtect("write"), async (req, res) => {
  const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await logaudit({
    userId: req.user._id,
    action: "Document updated",
    resource: "Document",
    resourceId: req.params.id,
    ip: req.ip,
    status: "success",
    category: "permission",
  });
  res.json({ message: "Document updated", document: doc });
});


router.post(
  "/reports/:id/approve",
  protect,
  abacProtect("report", "approve"),
  async (req, res) => {
    const report = await Document.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = "Approved";
    report.approvedBy = req.user._id;
    report.approvedAt = new Date();
    await report.save();

    res.json({ message: `Report ${report._id} approved`, report });
  }
);


router.post("/documents", protect, allowRoles("Admin", "Manager"), async (req, res) => {
  const { title, content, type, sensitivityLevel } = req.body;

  const doc = await Document.create({
    title,
    content,
    type: type || "general",
    sensitivityLevel: sensitivityLevel || "Internal",
    owner: req.user._id,
    sharedWith: [],
  });

  await logaudit({
    userId: req.user._id,
    action: "Document created",
    resource: "Document",
    resourceId: doc._id.toString(),
    ip: req.ip,
    status: "success",
    details: `Classification ${doc.sensitivityLevel}`,
  });

  res.status(201).json({ message: "Document created", document: doc });
});


router.post("/documents/:id/share", protect, dacProtect("write"), async (req, res) => {
  const { email, permission = "read" } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });


  const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!targetUser) {
    return res.status(404).json({ message: "User not found with this email" });
  }

  const userId = targetUser._id;
  const existing = doc.sharedWith.find((s) => s.user.toString() === userId.toString());
  if (existing) {
    existing.permission = permission;
    existing.grantedBy = req.user._id;
    existing.grantedAt = new Date();
  } else {
    doc.sharedWith.push({ user: userId, permission, grantedBy: req.user._id });
  }

  await doc.save();
  await doc.populate("sharedWith.user", "name email");

  await logaudit({
    userId: req.user._id,
    action: "DAC permission change",
    resource: "Document",
    resourceId: doc._id.toString(),
    ip: req.ip,
    status: "success",
    details: `Granted ${permission} to ${email}`,
  });

  res.json({ message: "Document shared", document: doc });
});

router.post("/documents/:id/revoke", protect, dacProtect("write"), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  // Find user by email
  const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!targetUser) {
    return res.status(404).json({ message: "User not found with this email" });
  }

  const userId = targetUser._id;
  doc.sharedWith = doc.sharedWith.filter((s) => s.user.toString() !== userId.toString());
  await doc.save();
  await doc.populate("sharedWith.user", "name email");

  await logaudit({
    userId: req.user._id,
    action: "DAC permission revoke",
    resource: "Document",
    resourceId: doc._id.toString(),
    ip: req.ip,
    status: "success",
    details: `Revoked access for ${email}`,
  });

  res.json({ message: "Access revoked", document: doc });
});


router.patch(
  "/documents/:id/classification",
  protect,
  allowRoles("Admin"),
  async (req, res) => {
    const { sensitivityLevel } = req.body;
    if (!sensitivityLevel) return res.status(400).json({ message: "sensitivityLevel is required" });
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { sensitivityLevel },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Document not found" });

    await logaudit({
      userId: req.user._id,
      action: "MAC classification change",
      resource: "Document",
      resourceId: doc._id.toString(),
      ip: req.ip,
      status: "success",
      details: `Set classification to ${sensitivityLevel}`,
    });

    res.json({ message: "Classification updated", document: doc });
  }
);

router.post(
  "/leave/:id/approve",
  protect,
  allowRoles("HR_Manager", "Admin"),
  rubac("leave_request", "approve"),
  async (req, res) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id);
      if (!leave) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      if (leave.status !== "pending") {
        return res.status(400).json({ message: "Leave already processed" });
      }

      leave.status = "approved";
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      leave.justification = req.body.justification || leave.justification;
      await leave.save();

      await logaudit({
        userId: req.user._id,
        action: "Leave approved via RuBAC",
        resource: "LeaveRequest",
        resourceId: req.params.id,
        ip: req.ip,
        status: "success",
        details: `Approved ${leave.days} days (${leave.type}) - Justification: ${req.body.justification || "None"}`,
        category: "permission",
        severity: "low",
      });

      res.json({ 
        message: "Leave approved successfully (RuBAC + policies passed)",
        leave 
      });
    } catch (err) {
      console.error(err);
      await logaudit({
        userId: req.user?._id,
        action: "Leave approval failed",
        resource: "LeaveRequest",
        resourceId: req.params.id,
        ip: req.ip,
        status: "failed",
        details: err.message,
        severity: "medium",
      });
      res.status(500).json({ message: "Server error during approval" });
    }
  }
);
module.exports = router;
