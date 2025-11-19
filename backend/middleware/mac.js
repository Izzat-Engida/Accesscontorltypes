const macProtect = (requiredLevel) => {
  const levels = {
    Public: 1,
    Internal: 2,
    Confidential: 3,
    TopSecret: 4
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userLevel = levels[req.user.clearanceLevel];
    const neededLevel = levels[requiredLevel];

    if (userLevel >= neededLevel) {
      return next();
    } else {
      return res.status(403).json({
        message: "MAC Access Denied",
        reason: `You have ${req.user.clearanceLevel}, but this requires ${requiredLevel} or higher`
      });
    }
  };
};

module.exports = macProtect;   