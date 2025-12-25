const express = require('express');
const cors = require("cors");
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000;
const connectdb = require('./config/db');
const cookieParser = require('cookie-parser');
const { logSystemEvent } = require("./utils/auditLogger");
const { scheduleBackups } = require("./utils/backupService");
const { ensureDefaultRules } = require("./utils/ruleBootstrap");

const app = express();
connectdb()
app.use(express.json());
app.use(cors({
    origin:process.env.FRONTEND_URL || "http://localhost:3000",
    credentials:true,
}));
app.use(cookieParser())

app.use(express.urlencoded({extended:false}));
app.use("/api/auth",require("./routes/auth"));
app.use("/api/access",require("./routes/access"));
app.use('/api/test',require("./routes/test"));
app.use("/api/leave",require("./routes/leave"));
app.use("/api/audit",require("./routes/audit"));
app.use("/api/admin",require("./routes/adminRoutes"));

scheduleBackups();

const server = app.listen(port,async ()=>{
    console.log(`server is running at post ${port}`);
    await logSystemEvent(`Server started on port ${port}`);
});

const shutdown = async (signal)=>{
    console.log(`Received ${signal}, shutting down...`);
    await logSystemEvent(`Server shutting down via ${signal}`);
    server.close(()=>process.exit(0));
};

["SIGINT","SIGTERM"].forEach(sig=>{
    process.on(sig,()=>shutdown(sig));
});