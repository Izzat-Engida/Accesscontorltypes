const mongoose=require("mongoose");
const documentSchema=new mongoose.Schema({
    title:String,
    content:String,
    owner:{
        type:mongoose.Schema.Types.ObjectId,ref:"User"
    },
    sensitivityLevel:{
        type:String,
        enum:["Public","Internal","Confidential"],
        default:"Internal"
    },
    sharedWith:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,ref:"User"
        },
        permission:{
            type:String,
            enum:["read","write"],
            default:"read"
        }
    }]
},{timestamps:true})
module.exports=mongoose.model("Document",documentSchema)