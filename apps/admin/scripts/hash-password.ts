import { hashPassword } from '../src/worker/auth/password';

const password = process.argv[2];
if (!password) {
  console.error('Usage: tsx scripts/hash-password.ts <password>');
  process.exit(1);
}

const hash = await hashPassword(password);
console.log(hash);
