const crypto = require('crypto');

// Generate a secure, random secret key
const secretKey = crypto.randomBytes(32).toString('hex'); // 32 bytes for a 256-bit key

console.log('Generated Secret Key:', secretKey);