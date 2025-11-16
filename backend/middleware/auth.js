const jwt=require("jsonwebtoken")

module.exports=(req,res,next)=>{
    try{
        const token=req.cookies.token;
        if(!token){
            return res.status(401).json({message:"no token"})
        }
        const decod=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decod
        next();

    }
    catch(err){
        return res.status(401).json({message:"invalid token"})
    }
}