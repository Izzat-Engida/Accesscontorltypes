const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -otpCode -otpExpires");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, department } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, department }, { new: true }).select("-password -otpCode -otpExpires");
  res.json({ message: "Profile updated successfully", user });
});
module.exports = {
  getMe,
  updateMe,
};