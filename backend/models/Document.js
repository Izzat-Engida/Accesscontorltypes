const mongoose=require("mongoose");

const documentSchema=new mongoose.Schema({
    title:{type:String,required:true},
    content:{type:String,required:true},
    type:{type:String,default:"general"},
    owner:{
        type:mongoose.Schema.Types.ObjectId,ref:"User",required:true
    },
    sensitivityLevel:{
        type:String,
        enum:["Public","Internal","Confidential","TopSecret"],
        default:"Internal"
    },
    sharedWith:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,ref:"User",required:true
        },
        permission:{
            type:String,
            enum:["read","write"],
            default:"read"
        },
        grantedBy:{
            type:mongoose.Schema.Types.ObjectId,ref:"User"
        },
        grantedAt:{type:Date,default:Date.now}
    }]
},{timestamps:true})
module.exports=mongoose.model("Document",documentSchema)