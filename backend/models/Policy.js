const mongoose=require("mongoose");
const policySchema=new mongoose.Schema({
    name:String,
    resource:String,
    action:String,
    conditions:{
        role:[String],
        department:[String],
        clearanceLevel:[String],
        time:{
            start:String,
            end:String,
            days:[String]
        },
        allowedIps:[String],
        requiresActiveStatus:Boolean
    },
    enabled:{type:Boolean,default:true}
})
module.exports=mongoose.model("Policy",policySchema);