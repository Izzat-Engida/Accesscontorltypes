const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

const clearanceOrder = ["Public", "Internal", "Confidential", "TopSecret"];

function compareClearance(current, required) {
  const currentIdx = clearanceOrder.indexOf(current);
  const requiredIdx = clearanceOrder.indexOf(required);
  if (currentIdx === -1 || requiredIdx === -1) return -1;
  return currentIdx - requiredIdx;
}

function isIpAllowed(ip, allowedRanges = []) {
  if (!ip) return false;
  return allowedRanges.some((range) => matchIp(ip, range));
}

function matchIp(ip, range) {
  if (!range.includes("/")) {
    return ip === range;
  }

  if (!CIDR_REGEX.test(range)) return false;

  const [rangeIp, prefix] = range.split("/");
  const mask = parseInt(prefix, 10);
  const ipBuffer = ipToBuffer(ip);
  const rangeBuffer = ipToBuffer(rangeIp);
  if (!ipBuffer || !rangeBuffer) return false;

  const maskBytes = maskToBuffer(mask);
  for (let i = 0; i < 4; i++) {
    if ((ipBuffer[i] & maskBytes[i]) !== (rangeBuffer[i] & maskBytes[i])) {
      return false;
    }
  }
  return true;
}

function ipToBuffer(ip) {
  const octets = ip.split(".").map((o) => parseInt(o, 10));
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) return null;
  return Buffer.from(octets);
}

function maskToBuffer(mask) {
  const buffer = Buffer.alloc(4, 0);
  for (let i = 0; i < mask; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = 7 - (i % 8);
    buffer[byteIndex] |= 1 << bitIndex;
  }
  return buffer;
}

module.exports = { compareClearance, isIpAllowed };

