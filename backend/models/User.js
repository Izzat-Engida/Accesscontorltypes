const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    name:String,
    email:{type:String,unique:true},
    password:String,
    role:{type:String,default:"Employee"},
    department:String,
    clearanceLevel:{type:String,default:"Public"},
    failedAttempts:{type:Number,default:0},
    accountLocked:{type:Boolean,default:false}
})
module.exports=mongoose.model("User",userSchema)