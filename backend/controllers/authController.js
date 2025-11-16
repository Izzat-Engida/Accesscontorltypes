const User=require('../models/User')
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const asynchandler=require('express-async-handler')

const register=asynchandler(
    async (req,res)=>{
        try{
            const {name,email,password}=req.body;
            const existing=await User.findOne({email})
            if(existing){
                return res.status(400).json({message:"email already in use"})
            }
            const hash=await bcrypt.hash(password,10);
            const user=await User.create({
                name,
                email,
                password:hash
            })
        res.json({message:"account created",user})
        }catch(err){
            res.status(500).json({error:err.message})
        }
    }
)
const login=asynchandler(async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({
                message:"invalid login inputs"
            })
        }
        if(user.accountLocked){
            return res.status(403).json({message:"account is locked"})
        }
        const match=await bcrypt.compare(password,user.password)
        if (!match){
            user.failedAttempts+=1
            if(user.failedAttempts>=5){
                user.accountLocked=true
            }
            await user.save();
            return res.status(400).json({message:"invalid credentials"})
        }
        user.failedAttempts=0;
        user.accountLocked=false;
        await user.save()
        const token=jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        )
        res.cookie("token",token,{
            httpOnly:true,
            secure:false
        })
        res.json({message:"Login success",token})
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})
const logout=asynchandler(async(req,res)=>{
    res.clearCookie("token")
    res.json({message:"Logged out correclty"})
})
module.exports={register,login,logout}