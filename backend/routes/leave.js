// routes/leave.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const abacProtect = require("../middleware/abac");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");

// hr ppl
router.post(
  "/approve",
  protect,
  allowRoles("HR_Manager"),
  macProtect("Internal"),
  abacProtect("leave_request", "approve"),
  (req, res) => {
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