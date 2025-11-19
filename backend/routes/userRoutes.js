//user management route
const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Protect all routes and authorize only Admin or HR_Manager
router.use(protect);
router.use(authorize(["Admin", "HR_Manager"]));

router.get("/", userCtrl.getAllUsers);          // GET all users
router.get("/:id", userCtrl.getUserById);       // GET single user
router.put("/:id", userCtrl.updateUser);        // Update role, department, clearance
router.put("/:id/lock", userCtrl.toggleLockUser); // Lock/Unlock account
router.put("/:id/reset-password", userCtrl.forceResetPassword); // Force reset
router.delete("/:id", userCtrl.deleteUser);     // Delete user

module.exports = router;
