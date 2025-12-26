const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");
const rubac = require("../middleware/rubac");
const abacProtect = require("../middleware/abac");
const { logaudit } = require("../utils/auditLogger");
const LeaveRequest = require("../models/LeaveRequest");

router.post(
  "/",
  protect,
  allowRoles("Employee", "Manager", "HR_Manager", "Admin"),
  async (req, res) => {
    try {
      const { type, startDate, endDate, days, reason } = req.body;

      // Replace with real manager logic later (e.g., from user profile)
      const defaultManagerId = "694d604920c0f15704caa0ab";

      const leave = await LeaveRequest.create({
        user: req.user._id,
        manager: defaultManagerId,
        type,
        startDate,
        endDate,
        days,
        reason,
      });

      await logaudit({
        userId: req.user._id,
        action: "Leave request submitted",
        resource: "LeaveRequest",
        resourceId: leave._id,
        status: "success",
        details: `${days} days, ${type}`,
        category: "permission",
        severity: "low",
      });

      res.status(201).json({ message: "Leave request submitted", leave });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error submitting leave request" });
    }
  }
);

// Approve leave — protected by RBAC + MAC + RuBAC + ABAC
router.post(
  "/approve/:id",
  protect,
  allowRoles("HR_Manager", "Manager", "Admin"),
  macProtect("Internal"),
  rubac("leave_request", "approve"),
  abacProtect("leave_request", "approve"),
  async (req, res) => {
    try {
      const leave = await LeaveRequest.findById(req.params.id);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      if (leave.status !== "pending") return res.status(400).json({ message: "Leave already processed" });

      leave.status = "approved";
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      leave.justification = req.body.justification || leave.justification;
      await leave.save();

      await logaudit({
        userId: req.user._id,
        action: "Leave approved via RuBAC",
        resource: "LeaveRequest",
        resourceId: leave._id,
        status: "success",
        details: `Approved ${leave.days} days (${leave.type})`,
        category: "permission",
        severity: "low",
      });

      res.json({ message: "Leave approved successfully", leave });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to approve leave" });
    }
  }
);

// Reject leave
router.post("/reject/:id", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    leave.status = "rejected";
    leave.rejectedReason = reason;
    leave.approvedBy = req.user._id;
    await leave.save();

    res.json({ message: "Leave rejected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject" });
  }
});

// List pending leaves
router.get("/pending", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const pendingLeaves = await LeaveRequest.find({ status: "pending" })
      .populate("user", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      pending: pendingLeaves,
      count: pendingLeaves.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending leaves" });
  }
});


router.get("/salary", protect, abacProtect("salary_data", "read"), (req, res) => {
  res.json({ message: "Salary data loaded", data: "ETB 10,000" });
});

module.exports = router;