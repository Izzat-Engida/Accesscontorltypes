const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { getMe ,updateMe} = require("../controllers/personal");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/verify-otp", auth.verifyOtp);
router.post("/verify-email", auth.verifyEmail);
router.post("/resend-verification", auth.resendVerification);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/refresh-token", auth.refreshToken);
router.get("/me", protect,getMe );
router.put("/me", protect,updateMe );
router.post("/change-password", protect, auth.changePassword);

router.post("/enable-mfa", protect, auth.enableMfa);
router.post("/logout", protect, auth.logout);

module.exports = router;
