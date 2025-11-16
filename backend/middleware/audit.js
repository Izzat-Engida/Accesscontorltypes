const AuditLog=require('../models/AuditLog')

function logaction(action,details={}){
    return async(req,res,next)=>{
        const userId=req.user?.id||null;
        const ip=req.ip;
        await AuditLog.create({
            user:userId,
            action,
            ip,
            details
        })
        next();
    }
}
module.exports={logaction}