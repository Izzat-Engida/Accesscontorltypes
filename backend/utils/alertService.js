const sendEmail = require("./sendEmail");

const sendSecurityAlert = async (subject, message) => {
  const target = process.env.ALERT_EMAIL;
  if (!target) return;

  try {
    await sendEmail(target, subject, message);
  } catch (err) {
    console.error("Failed to dispatch security alert", err.message);
  }
};

module.exports = { sendSecurityAlert };

