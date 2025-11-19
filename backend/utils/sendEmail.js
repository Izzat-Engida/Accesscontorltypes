const nodemailed=require("nodemailer");

const sendEmail=async(to,subject,text)=>{
    const transporter=nodemailed.createTransport({
        service:"gmail",
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        },
    })
    await transporter.sendMail({
        from:"the system",
        to,
        subject,
        text,
    })
}
module.exports=sendEmail;