const router=require('express').Router();
const protect=require('../middleware/protect');
const allowRoles=require('../middleware/allowRoles');

router.get("/pending", protect, allowRoles("HR_Manager", "Manager", "Admin"), async (req, res) => {
  try {
    const pendingLeaves = await LeaveRequest.find({ status: "pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      message: "Pending leave requests",
      pending: pendingLeaves,
      count: pendingLeaves.length
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending leaves" });
  }
});