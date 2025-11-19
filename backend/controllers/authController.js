
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { logaudit } = require("../utils/auditLogger");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const axios=require("axios");

// helper: generate access token (JWT)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );
};

const createAndStoreRefreshToken = async (user, res) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const hashed = await bcrypt.hash(refreshToken, 12);
  user.refreshTokenHash = hashed;
  await user.save();

  // store refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE || `${7 * 24 * 60 * 60 * 1000}`, 10), // default 7 days
  });
};

// ------------------ REGISTER ------------------
const register = asyncHandler(async (req, res) => {
  const { name, email, password, department,recaptachaToken } = req.body;

  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password required" });


  if(!recaptachaToken) return res.status(400).json({message:"please comaplete the recaptcha"});
  const secretKey=process.env.SECRET_KEY;
  const response=await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptachaToken}`);
  if(!response.data.success){
    return res.status(400).json({message:"recaptcha verification failed"});
  }
  // password validation - enforce minimal complexity
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password.trim(), 12);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    department: department || "General",
    clearanceLevel: "Internal",
  });

  await logaudit({ userId: user._id, action: "User registered", ip: req.ip, status: "success" });

  res.status(201).json({
    message: "User registered successfully",
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});

// ------------------ LOGIN (password check + MAY issue OTP) ------------------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (user.accountLocked && user.lockUntil && user.lockUntil > new Date()) {
    return res.status(403).json({ message: "Account locked. Try again later." });
  }

  const isMatch = await bcrypt.compare(typeof password === "string" ? password : "", user.password);
  if (!isMatch) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= 5) {
      user.accountLocked = true;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    await user.save();
    await logaudit({ userId: user._id, action: "Login failed", ip: req.ip, userAgent: req.get("User-Agent"), status: "failed" });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // reset failed attempts
  user.failedAttempts = 0;
  user.accountLocked = false;
  user.lockUntil = null;

  // If MFA enabled -> generate OTP and email
  if (user.mfaEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    await sendEmail(user.email, "Your OTP Code", `Your OTP is: ${otp}. Expires in 5 minutes.`);
    await logaudit({ userId: user._id, action: "OTP sent", ip: req.ip, status: "pending" });

    return res.status(200).json({ message: "MFA required. OTP sent to email.", mfaRequired: true, userId: user._id });
  }

  // No MFA -> issue tokens
  await user.save();

  const accessToken = generateAccessToken(user);
  await createAndStoreRefreshToken(user, res);

  // cookie for access token (short-lived) OR send in body - here we use cookie
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10), // default 15m
  });

  await logaudit({ userId: user._id, action: "Login success", ip: req.ip, userAgent: req.get("User-Agent"), status: "success" });

  res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// ------------------ VERIFY OTP (for MFA) ------------------
const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ message: "Missing fields" });

  const user = await User.findById(userId);
  if (!user || !user.otpCode) return res.status(400).json({ message: "OTP not found" });
  if (user.otpExpires < new Date()) return res.status(400).json({ message: "OTP expired" });

  const ok = await bcrypt.compare(otp, user.otpCode);
  if (!ok) {
    await logaudit({ userId: user._id, action: "OTP verify failed", ip: req.ip, status: "failed" });
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // clear otp and set verified flag
  user.otpCode = null;
  user.otpExpires = null;
  user.otpVerified = true;
  await user.save();

  // issue tokens
  const accessToken = generateAccessToken(user);
  await createAndStoreRefreshToken(user, res);

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10),
  });

  await logaudit({ userId: user._id, action: "OTP verified & tokens issued", ip: req.ip, status: "success" });

  res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

// ------------------ ENABLE MFA (user must be authenticated) ------------------
const enableMfa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.mfaEnabled = true;
  await user.save();
  await logaudit({ userId: user._id, action: "MFA enabled", ip: req.ip, status: "success" });
  res.json({ message: "MFA enabled" });
});

// ------------------ REFRESH TOKEN endpoint ------------------
const refreshToken = asyncHandler(async (req, res) => {
  const sent = req.cookies?.refreshToken;
  if (!sent) return res.status(401).json({ message: "No refresh token" });

  // find user by matching hashed value
  const user = await User.findOne({}); // we'll search all users and compare - better to store userId with token in production
  // More efficient: store refresh token id + userId pair. For brevity, we check user.refreshTokenHash.
  const allUsers = await User.find({ refreshTokenHash: { $ne: null } });
  let matchedUser = null;
  for (const u of allUsers) {
    if (await bcrypt.compare(sent, u.refreshTokenHash)) {
      matchedUser = u;
      break;
    }
  }
  if (!matchedUser) return res.status(401).json({ message: "Invalid refresh token" });

  // issue new access token and optionally new refresh token (rotate)
  const accessToken = jwt.sign(
    {
      id: matchedUser._id,
      role: matchedUser.role,
      department: matchedUser.department,
      clearanceLevel: matchedUser.clearanceLevel,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );

  // rotate refresh token
  await createAndStoreRefreshToken(matchedUser, res);

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10),
  });

  await logaudit({ userId: matchedUser._id, action: "Refresh token used", ip: req.ip, status: "success" });

  res.json({ message: "Token refreshed" });
});

// ------------------ LOGOUT ------------------
const logout = asyncHandler(async (req, res) => {
  // clear cookies
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  const refreshSent = req.cookies?.refreshToken;
  if (refreshSent) {
    // clear stored refresh token hash for this user (logout everywhere)
    const allUsers = await User.find({ refreshTokenHash: { $ne: null } });
    for (const u of allUsers) {
      if (await bcrypt.compare(refreshSent, u.refreshTokenHash)) {
        u.refreshTokenHash = null;
        await u.save();
        break;
      }
    }
    res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  }

  await logaudit({ userId: req.user?.id || null, action: "Logout", ip: req.ip, status: "success" });
  res.json({ message: "Logged out successfully" });
});

// ------------------ FORGOT PASSWORD ------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(200).json({ message: "If that email exists we sent a reset link" }); // do not reveal user existence

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = await bcrypt.hash(resetToken, 12);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

  await sendEmail(user.email, "Password reset", `Reset your password: ${resetLink}\nThis link expires in 1 hour.`);
  await logaudit({ userId: user._id, action: "Password reset requested", ip: req.ip, status: "pending" });

  res.json({ message: "If that email exists we sent a reset link" });
});

// ------------------ RESET PASSWORD ------------------
const resetPassword = asyncHandler(async (req, res) => {
  const { userId, token, newPassword } = req.body;
  if (!userId || !token || !newPassword) return res.status(400).json({ message: "Missing fields" });

  const user = await User.findById(userId);
  if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpires) return res.status(400).json({ message: "Invalid or expired token" });
  if (user.resetPasswordExpires < new Date()) return res.status(400).json({ message: "Token expired" });

  const ok = await bcrypt.compare(token, user.resetPasswordTokenHash);
  if (!ok) return res.status(400).json({ message: "Invalid token" });

  // update password
  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  await logaudit({ userId: user._id, action: "Password reset", ip: req.ip, status: "success" });

  res.json({ message: "Password reset successful" });
});

module.exports = {
  register,
  login,
  verifyOtp,
  enableMfa,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
