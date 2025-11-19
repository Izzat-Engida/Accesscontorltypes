const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const {logaudit}=require("../utils/auditLogger")

const register = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;


  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

let passwordStr = password;
if (typeof password === "number") {
  passwordStr = password.toString();
} else if (typeof password !== "string") {
  return res.status(400).json({ message: "Invalid password format" });
}


  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }


  const hashedPassword = await bcrypt.hash(password.trim(), 12);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    department: department || "General",
    clearanceLevel: "Internal",
  });

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  
  if (user.accountLocked && user.lockUntil && user.lockUntil > new Date()) {
    return res.status(403).json({ message: "Account is locked. Try again later." });
  }

  
  const isMatch = await bcrypt.compare(typeof password === "string" ? password : "", user.password);
  if (!isMatch) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= 5) {
      user.accountLocked = true;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); 
    }
    await user.save();
    await logaudit({
      userId:user?._id,
      action:"Login failed",
      ip:req.ip,
      userAgent:req.get("User-Agent"),
      status:"Failed",
      details:"wrong password"
    })
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.failedAttempts = 0;
  user.accountLocked = false;
  user.lockUntil = null;
  await user.save();
  await logaudit({
    userId:user._id,
    action:"Login success",
    ip:req.ip,
    userAgent:req.get("User-Agent"),
    status:"success"
  })

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, 
  });

  res.json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
    },
  });
});
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
});

module.exports = { register, login, logout };