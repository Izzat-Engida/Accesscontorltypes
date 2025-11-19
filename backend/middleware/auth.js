const jwt=require("jsonwebtoken")
const User=require("../models/User")
const protect =async (req,res,next) =>{
    const token=req.cookies.token;
    if(!token){
        return res.status(401).json({message:"not authorized"})
    } 
    try{
        const decod=jwt.verify(token,process.env.JWT_SECRET)
        req.user=await User.findById(decod.id).select("-password");
        next();
    }catch(err){
        res.status(401).json({message:"Invalid token"})
    }
}
module.exports={protect}