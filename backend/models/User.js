const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    name:String,
    email:{type:String,unique:true},
    password:String,
    role:{type:String,
        enum: ["Admin", "HR_Manager", "Finance_Manager", "Manager", "Employee"],
        default: "Employee"
    },
    department:{type:String,
        enum: ["HR", "Finance", "IT", "Sales", "General"],
        default: "General"
    },
    clearanceLevel:{type:String,
        enum: ["Public", "Internal", "Confidential", "TopSecret"],
        default:"Internal"},
    failedAttempts:{type:Number,default:0},
    accountLocked:{type:Boolean,default:false},
    localUntil:{type:Date},
},{timestamps:true})
module.exports=mongoose.model("User",userSchema)