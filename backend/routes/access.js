const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

router.get("/admin", protect, allowRoles("Admin"), (req, res) => {
    res.json({ message: "Admin dashboard" });
});

router.get("/employee", protect, allowRoles("Employee", "Admin"), (req, res) => {
    res.json({ message: "Employee panel" });
});

router.get("/public", protect, allowRoles("User", "Employee", "Admin"), (req, res) => {
    res.json({ message: "Public Resource" });
});

module.exports = router;
