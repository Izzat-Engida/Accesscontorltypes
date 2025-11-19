const AuditLog=require("../models/AuditLog")

const logaudit=async ({userId,action,resource,resourceId,ip,userAgent,status="success",details})=>{
    try{
        await AuditLog.create({
            user:userId||null,
            action,
            resource,
            resourceId,
            ip,
            userAgent,
            status,
            details:details||null
        })
    }catch(err){
        console.error("audit log faild: ",err.message)
    }
}
module.exports={logaudit}