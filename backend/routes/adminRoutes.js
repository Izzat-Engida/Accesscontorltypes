const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("Admin"));

router.get("/users", admin.getAllUsers);
router.get("/users/:id", admin.getUserById);
router.put("/users/:id", admin.updateUserAdmin);
router.delete("/users/:id", admin.deleteUser);

router.patch("/users/:id/enable-mfa", admin.enableMfa);
router.patch("/users/:id/disable-mfa", admin.disableMfa);
router.patch("/users/:id/role", admin.updateRole);
router.patch("/users/:id/attributes", admin.updateAttributes);

module.exports = router;
