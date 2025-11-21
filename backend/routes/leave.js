// routes/leave.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const abacProtect = require("../middleware/abac");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");
const rubac = require("../middleware/rubac");
const { logaudit } = require("../utils/auditLogger");

// hr ppl
router.post(
  "/approve",
  protect,
  allowRoles("HR_Manager"),
  macProtect("Internal"),
  rubac("leave_request", "approve"),
  abacProtect("leave_request", "approve"),
  async (req, res) => {
    await logaudit({
      userId: req.user._id,
      action: "Leave approval",
      resource: "LeaveRequest",
      resourceId: req.body.requestId || null,
      ip: req.ip,
      status: "success",
      details: `Days approved: ${req.body.days || "N/A"}`,
      category: "permission",
      severity: "low",
    });
    res.json({ message: "Leave approved! Policy passed." });
  }
);

//finace pp.
router.get(
  "/salary",
  protect,
  abacProtect("salary_data", "read"),
  (req, res) => {
    res.json({ message: "Salary data loaded", data: "ETB 10,000" });
  }
);

module.exports = router;