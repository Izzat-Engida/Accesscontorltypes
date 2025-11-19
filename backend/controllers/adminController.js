const User=require("../models/User")
const asyncHandler=require("express-async-handler")
const {logaudit}=require("../utils/auditLogger")

const getAllUsers=asyncHandler(async(req,res)=>{
    const users=await User.find().select("-password -otpcode -otpExpires");
    res.json({users})
})

const getUser=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.params.id).select("-password -otpcode -otpExpires");
    if(!user) return res.status(404).json({message:"User not found"});
    res.json({user})
})

const updateUserAdmin=asyncHandler(async(req,res)=>{
    const allowed=[
        "name",
        "role",
        "department",
        "clearanceLevel",
        "mfaEnabled",
        "accountLocked"
    ]
    const updates={};
    allowed.forEach(field=>{
        if(req.body[field]!==undefined){
            updates[field]=req.body[field];
        }
    })
    const user=await User.findByIdAndUpdate(req.params.id,updates,{new:true}).select("-password -otpcode -otpExpires");
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`admin updates user ${user._id} with the name ${user.name}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`Updated fields: ${Object.keys(updates).join(", ")}`
    })
    res.json({message:"user updated", user})
})
const deleteUser=asyncHandler(async(req,res)=>{
    const user =await User.findByIdAndDelete(req.params.id);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`admin deleted user ${user._id} with the name ${user.name}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`User ${user.name} deleted by admin ${req.user._id}`
    })
    res.json({message:"user deleted"})
})
module.exports={
    getAllUsers,
    getUser,
    updateUserAdmin,
    deleteUser
}