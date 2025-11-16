const mongoose=require("mongoose")
const roleSchema= new mongoose.Schema({
    name:{type:String,unique:String},
    permissions:[String]
})
module.exports=mongoose.model("Role",roleSchema)