const express=require('express')
const cors=require("cors")
const dotenv=require('dotenv').config()
const port=process.env.PORT || 5000
const connectdb=require('./config/db')
const cookieParser = require('cookie-parser')

const app=express()
connectdb()
app.use(express.json())
app.use(cors())
app.use(cookieParser());

app.use(express.urlencoded({extended:false}))
app.use("/api/auth",require("./routes/auth"));
app.use("/api/access",require("./routes/access"))
app.use('/api/test',require("./routes/test"))
app.use("/api/leave",require("./routes/leave"))
app.use("/api/audit",require("./routes/audit"));
app.listen(port,()=>{
    console.log(`server is running at post ${port}`)
})