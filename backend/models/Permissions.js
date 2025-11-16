const mongoose=require("mongoose")

const permissionSchema=new mongoose.Schema({
    action:String,
    resource:String,
    conditions:Object
})
module.exports=mongoose.model("Permission",permissionSchema)