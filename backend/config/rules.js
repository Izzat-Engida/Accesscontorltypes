const defaultWorkDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

module.exports = {
  workingHours: {
    type: "timeWindow",
    start: process.env.RUBAC_WORK_START || "08:00",
    end: process.env.RUBAC_WORK_END || "18:00",
    days: (process.env.RUBAC_WORK_DAYS && process.env.RUBAC_WORK_DAYS.split(",")) || defaultWorkDays,
    exceptRoles: ["Admin"],
    overrideField: "body.preapproved",
    message: "Access permitted only during approved working hours",
  },
  hrLongLeaveApproval: {
    type: "conditional",
    condition: { field: "body.days", operator: ">", value: 10 },
    allowedRoles: ["HR_Manager"],
    message: "Only HR Managers may approve leave requests longer than 10 days",
  },
  trustedNetworkOnly: {
    type: "ipRange",
    allowedCidrs: (process.env.RUBAC_ALLOWED_CIDRS && process.env.RUBAC_ALLOWED_CIDRS.split(",")) || ["10.0.0.0/24", "127.0.0.1/32"],
    exceptRoles: ["Admin"],
    message: "Requests must originate from the trusted corporate network",
  },
};

