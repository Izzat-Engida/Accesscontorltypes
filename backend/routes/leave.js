// routes/leave.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const abacProtect = require("../middleware/abac");
const allowRoles = require("../middleware/rbac");
const macProtect = require("../middleware/mac");
const rubac = require("../middleware/rubac");
const { logaudit } = require("../utils/auditLogger");
const LeaveRequest = require("../models/LeaveRequest");

router.post('/',protect,async(req,res)=>{
  try{
    const {type,startDate,endDate,days,reason}=req.body
    const defaultManagerId="694d604920c0f15704caa0ab";
    const leave=await LeaveRequest.create({
      user:req.user._id,
      manager:defaultManagerId,
      type,
      startDate,
      endDate,
      days,
      reason
    })
    await logaudit({
      userId: req.user._id,
      action: "Leave request submitted",
      resource: "LeaveRequest",
      resourceId: leave._id,
      status: "success",
      details: `${days} days, ${type}`,
    });
    res.status(201).json({message:"Leave request submitted",leave})
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Error submitting leave request"}); 
  }

})
router.post("/approve/:id", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    leave.status = "approved";
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    await logaudit({
      userId: req.user._id,
      action: "Leave approved",
      resource: "LeaveRequest",
      resourceId: leave._id,
      status: "success",
      details: `Approved for user ${leave.user}`,
    });

    res.json({ message: "Leave approved", leave });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve" });
  }
});
router.post("/reject/:id", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    leave.status = "rejected";
    leave.rejectedReason = reason;
    leave.approvedBy = req.user._id; // or rejectedBy
    await leave.save();

    res.json({ message: "Leave rejected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject" });
  }
});
// hr ppl
router.post(
  "/approve",
  protect,
  allowRoles("HR_Manager"),
  macProtect("Internal"),
  rubac("leave_request", "approve"),
  abacProtect("leave_request", "approve"),
  async (req, res) => {
    await logaudit({
      userId: req.user._id,
      action: "Leave approval",
      resource: "LeaveRequest",
      resourceId: req.body.requestId || null,
      ip: req.ip,
      status: "success",
      details: `Days approved: ${req.body.days || "N/A"}`,
      category: "permission",
      severity: "low",
    });
    res.json({ message: "Leave approved! Policy passed." });
  }
);

//finace pp.
router.get(
  "/salary",
  protect,
  abacProtect("salary_data", "read"),
  (req, res) => {
    res.json({ message: "Salary data loaded", data: "ETB 10,000" });
  }
);
router.get("/pending", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const pendingLeaves = await LeaveRequest.find({ status: "pending" })
      .populate("user", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      pending: pendingLeaves,
      count: pendingLeaves.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending leaves" });
  }
});
module.exports = router;