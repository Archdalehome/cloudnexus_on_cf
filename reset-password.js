import bcrypt from 'bcryptjs';

// 生成新的密码哈希
const password = 'admin';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('新的密码哈希值：', hash);
console.log('\n请使用这个哈希值更新schema.sql中的密码字段');