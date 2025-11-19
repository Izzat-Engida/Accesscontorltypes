const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { logaudit } = require("../utils/auditLogger");

// ------------------ Get all users (Admin only) ------------------
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -otpCode -refreshTokenHash");
  await logaudit({ userId: req.user._id, action: "Get all users", status: "success", ip: req.ip });
  res.json(users);
});

// ------------------ Get single user by ID ------------------
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -otpCode -refreshTokenHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  await logaudit({ userId: req.user._id, action: `Get user ${user._id}`, status: "success", ip: req.ip });
  res.json(user);
});


const updateUser = asyncHandler(async (req, res) => {
  const { role, department, clearanceLevel, mfaEnabled } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });


  if (role) user.role = role;
  if (department) user.department = department;
  if (clearanceLevel) user.clearanceLevel = clearanceLevel;
  if (typeof mfaEnabled === "boolean") user.mfaEnabled = mfaEnabled;

  await user.save();
  await logaudit({ userId: req.user._id, action: `Update user ${user._id}`, status: "success", ip: req.ip });

  res.json({ message: "User updated", user });
});

// ------------------ Lock / Unlock account ------------------
const toggleLockUser = asyncHandler(async (req, res) => {
  const { lock } = req.body; // true = lock, false = unlock
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.accountLocked = lock;
  if (lock) {
    user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min default lock
  } else {
    user.lockUntil = null;
    user.failedAttempts = 0;
  }
  await user.save();
  await logaudit({ userId: req.user._id, action: `${lock ? "Lock" : "Unlock"} user ${user._id}`, status: "success", ip: req.ip });

  res.json({ message: `User ${lock ? "locked" : "unlocked"}` });
});

// ------------------ Force password reset ------------------
const forceResetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const tempPassword = Math.random().toString(36).slice(-8);
  user.password = await bcrypt.hash(tempPassword, 12);
  await user.save();

  await logaudit({ userId: req.user._id, action: `Force password reset for ${user._id}`, status: "success", ip: req.ip });

  res.json({ message: "Password reset successfully", tempPassword }); // Admin can send temp password to user via email
});

// ------------------ Delete user ------------------
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await user.remove();
  await logaudit({ userId: req.user._id, action: `Deleted user ${user._id}`, status: "success", ip: req.ip });

  res.json({ message: "User deleted" });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  toggleLockUser,
  forceResetPassword,
  deleteUser,
};
