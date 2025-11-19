const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");

router.get("/profile", protect, (req, res) => {
  res.json({ message: "This is your profile", user: req.user });
});


router.get("/admin", protect, allowRoles("Admin"), (req, res) => {
  res.json({ message: "Welcome to Admin Panel" });
});


router.get("/hr-finance", protect, allowRoles("HR_Manager", "Finance_Manager","Admin"), (req, res) => {
  res.json({ message: "HR & Finance secret data" });
});


router.get("/confidential", protect, macProtect("Confidential"), (req, res) => {
  res.json({ message: "You have access to CONFIDENTIAL data!" });
});

module.exports = router;