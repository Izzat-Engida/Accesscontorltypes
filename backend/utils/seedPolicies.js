require("dotenv").config();      
const connectdb = require("../config/db");
const Policy = require("../models/Policy");

console.log("Starting policy seeding...");

const runSeeder = async () => {
  try {
    
    await connectdb();

    console.log("Connected to MongoDB Atlas");

    await Policy.deleteMany({});
    console.log("Old policies cleared");

    const policies = [
      {
        name: "HR Approve Leave - Office Hours Only",
        resource: "leave_request",
        action: "approve",
        conditions: {
          role: ["HR_Manager"],
          department: ["HR"],
          time: { start: "08:00", end: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
          allowedIPs: ["192.168.1.0/24", "127.0.0.1"],
          requiresActiveStatus: true,
        },
      },
      {
        name: "Finance View Salary Data",
        resource: "salary_data",
        action: "read",
        conditions: {
          department: ["Finance"],
          clearanceLevel: ["Confidential", "TopSecret"],
        },
      },
      {
        name: "Manager View Reports - Weekdays Only",
        resource: "performance_report",
        action: "read",
        conditions: {
          role: ["Manager", "HR_Manager", "Admin"],
          time: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        },
      },
    ];

    await Policy.insertMany(policies);
    console.log("3 policies created successfully!");
    console.log("ABAC + RuBAC is LIVE!");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

runSeeder();