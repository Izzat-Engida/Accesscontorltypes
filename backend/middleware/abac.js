const Policy =require("../models/Policy");
const { logaudit } = require("../utils/auditLogger");

const abacProtect=(resource,action)=>{
    return async(req,res,next)=>{
        try{
            const policies=await Policy.find({resource,action,enabled:true})
            if(policies.length==0) return next();
            const user=req.user;
            const now=new Date();
            const currtime=now.toTimeString().slice(0,5)
            const currday=now.toLocaleString("en-us",{weekday:"short"})
            const clientip=req.ip || req.connection.remoteAddress;
            let allow=false;
            for(const policy of policies){
                const c=policy.conditions
                //role check
                if(c.role && !c.role.includes(user.role)) continue

                //deparement
                if (c.department && !c.department.includes(user.department)) continue
                
                if(c.clearanceLevel && !c.clearanceLevel.includes(user.clearanceLevel)) continue

                if (c.requiresActiveStatus && user.employementStatus !=="Active") continue;

                if(c.time){
                    const intime=currtime>=c.time.start && currtime<=c.time.end;
                    const inday=currday>=c.time.days.includes(currday)
                    if(!intime || !inday) continue
                }
                if(c.allowedIps){
                    const ipallowd=c.allowedIps.some(net=>isIPInRange(clientip,net))
                    if(!ipallowd)continue
                }
                allow=true;
                break
            }
            if(allow){
                next();
            }
            else{
                await logaudit({
                    userId:req.user._id,
                    action:"access denied",
                    resource,
                    action:action,
                    ip:req.ip,
                    status:"faild",
                    details:"ABAC policy failed"
                })
              res.status(403).json({
                message:"Access denied by plocity(abac)",
                resource,
                action,
                reason:"condition not met"
              })  
            }
        }catch(err){
            res.status(500).json({error:err.message})
        }
    }
}
function isIPInRange(ip,net){
    if(!net.includes("/")) return ip===net;
    const [range,mask]=net.split("/")
    if(mask!=="24") return false
    return ip.startsWith(range.split(".").slice(0,3).join("."))
}
module.exports=abacProtect