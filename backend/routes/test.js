const express=require("express")
const router=express.Router();
const User=require("../models/User");
const bcrypt=require("bcrypt");

router.post("/create-admin", async (req, res) => {
  try {
    const hash = await bcrypt.hash("123", 12);
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@gmail.com",
      password: hash,
      role: "Admin",
      clearanceLevel: "TopSecret",
      department: "General"
    });
    res.json({ message: "Admin created", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;