const Document=require("../models/Document");
const dacProtect=(premission="read")=>{
    return async(req,res,next)=>{
        try{
            const doc=await Document.findById(req.params.id);
            if(!doc) return res.status(404).json({message:"Document not found"});
            if(doc.owner.toString()===req.user._id.toString()) return next();

            const shared=doc.sharedWith.find(s=>s.user.toString()===req.user._id.toString());
            if(shared && shared.permission===permission || shared?.permission==="write"){
                return next();
            }
            res.status(403).json({message:"dac: Access denied"});
        }catch(err){
            res.status(500).json({error:err.message})
        }  
    }
}
module.exports={dacProtect}