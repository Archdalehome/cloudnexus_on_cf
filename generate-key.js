import crypto from 'crypto';
const randomKey = crypto.randomBytes(32).toString('hex');
console.log(randomKey);