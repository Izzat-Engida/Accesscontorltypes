
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { logaudit } = require("../utils/auditLogger");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const axios=require("axios");
const { evaluateRules } = require("../utils/ruleEngine");

const PASSWORD_POLICY = {
  minLength: 10,
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
  message: "Password must be at least 10 characters and include upper and lower case letters, a number, and a special character."
};

const isPasswordStrong = (password = "") =>
  typeof password === "string" && password.length >= PASSWORD_POLICY.minLength && PASSWORD_POLICY.regex.test(password);

const formatSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  clearanceLevel: user.clearanceLevel,
  mfaEnabled: user.mfaEnabled,
  emailVerified: user.emailVerified,
});

const issueVerificationEmail = async (user, ip) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationTokenHash = await bcrypt.hash(code, 12);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await sendEmail(
    user.email,
    "Verify your account",
    `Your verification code is ${code}.\nIt expires in 24 hours.\n\nIf you did not request this, please ignore the email.`
  );
  await logaudit({
    userId: user._id,
    action: "Email verification sent",
    resource: "User",
    resourceId: user._id.toString(),
    ip,
    status: "success",
    severity: "low",
  });
};

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

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE || `${7 * 24 * 60 * 60 * 1000}`, 10),
  });

  return refreshToken;
};


const register = asyncHandler(async (req, res) => {
  const { name, email, password, department,recaptachaToken } = req.body;

  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password required" });


  if(!recaptachaToken) return res.status(400).json({message:"please comaplete the recaptcha"});
  const secretKey=process.env.SECRET_KEY;
  const response=await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptachaToken}`);
  if(!response.data.success){
    return res.status(400).json({message:"recaptcha verification failed"});
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ message: PASSWORD_POLICY.message });
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

  await issueVerificationEmail(user, req.ip);
  await logaudit({ userId: user._id, action: "User registered", ip: req.ip, status: "success" });

  res.status(201).json({
    message: "User registered successfully. Check your email to verify the account.",
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
  });
});


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

  
  user.failedAttempts = 0;
  user.accountLocked = false;
  user.lockUntil = null;

  if (!user.emailVerified) {
    await issueVerificationEmail(user, req.ip);
    return res.status(403).json({ message: "Email not verified. Verification link sent." });
  }

  const { decision: accessDecision, rule: blockingRule } = await evaluateRules("system_access", "login", {
    user,
    ip: req.ip,
    location: req.headers["x-client-location"],
    time: new Date(),
  });

  if (accessDecision === "deny") {
    await logaudit({
      userId: user._id,
      action: "System access denied by rule",
      resource: "System",
      resourceId: null,
      ip: req.ip,
      status: "failed",
      severity: "high",
      details: `Rule ${blockingRule?.name} blocked login`,
    });
    return res.status(403).json({ message: "Access restricted outside approved conditions." });
  }

 
  if (user.mfaEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    await sendEmail(user.email, "Your OTP Code", `Your OTP is: ${otp}. Expires in 5 minutes.`);
    await logaudit({ userId: user._id, action: "OTP sent", ip: req.ip, status: "pending" });

    return res.status(200).json({ message: "MFA required. OTP sent to email.", mfaRequired: true, userId: user._id });
  }


  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await createAndStoreRefreshToken(user, res);

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10),
  });

  await logaudit({ userId: user._id, action: "Login success", ip: req.ip, userAgent: req.get("User-Agent"), status: "success" });

  res.json({
    message: "Login successful",
    user: formatSafeUser(user),
    accessToken,
    refreshToken,
  });
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

  const accessToken = generateAccessToken(user);
  const refreshToken = await createAndStoreRefreshToken(user, res);

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10),
  });

  await logaudit({ userId: user._id, action: "OTP verified & tokens issued", ip: req.ip, status: "success" });

  res.json({
    message: "Login successful",
    user: formatSafeUser(user),
    accessToken,
    refreshToken,
  });
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

  const refreshToken = await createAndStoreRefreshToken(matchedUser, res);

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE || `${15 * 60 * 1000}`, 10),
  });

  await logaudit({ userId: matchedUser._id, action: "Refresh token used", ip: req.ip, status: "success" });

  res.json({
    message: "Token refreshed",
    accessToken,
    refreshToken,
  });
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


  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  await logaudit({ userId: user._id, action: "Password reset", ip: req.ip, status: "success" });

  res.json({ message: "Password reset successful" });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.emailVerificationTokenHash) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ message: "Verification code expired" });
  }

  const match = await bcrypt.compare(code, user.emailVerificationTokenHash);
  if (!match) return res.status(400).json({ message: "Invalid verification code" });

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save();

  await logaudit({
    userId: user._id,
    action: "Email verified",
    resource: "User",
    resourceId: user._id.toString(),
    ip: req.ip,
    status: "success",
    severity: "low",
  });

  res.json({ message: "Email verified successfully" });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(200).json({ message: "If the account exists, a verification email was sent" });
  if (user.emailVerified) return res.status(200).json({ message: "Email already verified" });

  await issueVerificationEmail(user, req.ip);
  res.json({ message: "Verification email sent" });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    await logaudit({
      userId: user._id,
      action: "Password change failed",
      resource: "User",
      resourceId: user._id.toString(),
      ip: req.ip,
      status: "failed",
      severity: "medium",
      details: "Invalid current password",
    });
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({ message: PASSWORD_POLICY.message });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  await logaudit({
    userId: user._id,
    action: "Password changed",
    resource: "User",
    resourceId: user._id.toString(),
    ip: req.ip,
    status: "success",
    severity: "low",
  });

  res.json({ message: "Password updated successfully" });
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
  verifyEmail,
  resendVerification,
  changePassword,
};
