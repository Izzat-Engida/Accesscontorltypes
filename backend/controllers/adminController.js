const User=require("../models/User")
const asyncHandler=require("express-async-handler")
const {logaudit}=require("../utils/auditLogger")

const userProjection="-password -otpCode -otpExpires -refreshTokenHash -resetPasswordTokenHash";

const getAllUsers=asyncHandler(async(req,res)=>{
    const users=await User.find().select(userProjection);
    res.json({users})
})

const getUserById=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.params.id).select(userProjection);
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
        "accountLocked",
        "employmentStatus"
    ]
    const updates={};
    allowed.forEach(field=>{
        if(req.body[field]!==undefined){
            updates[field]=req.body[field];
        }
    })
    if(Object.keys(updates).length===0){
        return res.status(400).json({message:"No valid fields provided"});
    }
    const user=await User.findByIdAndUpdate(req.params.id,updates,{new:true}).select(userProjection);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin updated user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`Updated fields: ${Object.keys(updates).join(", ")}`
    })
    res.json({message:"User updated", user})
})

const deleteUser=asyncHandler(async(req,res)=>{
    const user =await User.findByIdAndDelete(req.params.id);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin deleted user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`User ${user.name} deleted by admin ${req.user._id}`
    })
    res.json({message:"User deleted"})
})

const enableMfa=asyncHandler(async(req,res)=>{
    const user=await User.findByIdAndUpdate(req.params.id,{mfaEnabled:true},{new:true}).select(userProjection);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin enabled MFA for user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success"
    })
    res.json({message:"MFA enabled", user})
})

const disableMfa=asyncHandler(async(req,res)=>{
    const user=await User.findByIdAndUpdate(req.params.id,{mfaEnabled:false},{new:true}).select(userProjection);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin disabled MFA for user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success"
    })
    res.json({message:"MFA disabled", user})
})

const updateRole=asyncHandler(async(req,res)=>{
    const {role}=req.body;
    if(!role) return res.status(400).json({message:"Role is required"});
    const allowedRoles=User.schema.path("role").enumValues;
    if(allowedRoles && !allowedRoles.includes(role)){
        return res.status(400).json({message:"Invalid role value"});
    }
    const user=await User.findByIdAndUpdate(req.params.id,{role},{new:true}).select(userProjection);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin updated role for user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`Role set to ${role}`
    })
    res.json({message:"Role updated", user})
})

const updateAttributes=asyncHandler(async(req,res)=>{
    const allowedFields=["department","clearanceLevel","employmentStatus","accountLocked"];
    const updates={};
    allowedFields.forEach(field=>{
        if(req.body[field]!==undefined){
            updates[field]=req.body[field];
        }
    })
    if(Object.keys(updates).length===0){
        return res.status(400).json({message:"No valid attributes provided"});
    }
    const user=await User.findByIdAndUpdate(req.params.id,updates,{new:true}).select(userProjection);
    if(!user) return res.status(404).json({message:"User not found"});
    await logaudit({
        userId:req.user._id,
        action:`Admin updated attributes for user ${user._id}`,
        resource:"User",
        resourceId:user._id,
        ip:req.ip,
        status:"success",
        details:`Updated fields: ${Object.keys(updates).join(", ")}`
    })
    res.json({message:"Attributes updated", user})
})

module.exports={
    getAllUsers,
    getUserById,
    updateUserAdmin,
    deleteUser,
    enableMfa,
    disableMfa,
    updateRole,
    updateAttributes
}