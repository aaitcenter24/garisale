const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Load environmental variables from the API's .env file
const envPath = path.resolve(__dirname, '../apps/api/.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn(`Warning: .env file not found at ${envPath}. Using default system environment variables.`);
}

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let phone = '+8801716659707';
  let email = 'aaitcenter24@gmail.com';
  let password = 'AMI.nul@g1!';
  let name = 'Garisale Super Admin';

  args.forEach(arg => {
    if (arg.startsWith('--phone=')) phone = arg.split('=')[1];
    if (arg.startsWith('--email=')) email = arg.split('=')[1];
    if (arg.startsWith('--password=')) password = arg.split('=')[1];
    if (arg.startsWith('--name=')) name = arg.split('=')[1];
  });

  console.log('Creating Super Admin account in the database...');
  console.log(`Name:  ${name}`);
  console.log(`Phone: ${phone}`);
  console.log(`Email: ${email}`);

  const hash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        email,
        password_hash: hash,
        full_name: name,
        role: 'admin_user',
        admin_role: 'super_admin',
        status: 'active',
        totp_enabled: false, // Force setup on first login
        totp_secret: null,
        totp_failed_attempts: 0,
      },
      create: {
        phone,
        email,
        password_hash: hash,
        full_name: name,
        role: 'admin_user',
        admin_role: 'super_admin',
        status: 'active',
        totp_enabled: false,
        totp_failed_attempts: 0,
      },
    });
    console.log('\n==================================================');
    console.log('SUPER ADMIN ACCOUNT SUCCESSFULLY CREATED / UPDATED');
    console.log('==================================================');
    console.log(`ID:       ${user.id}`);
    console.log(`Phone:    ${user.phone}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${user.role} (${user.admin_role})`);
    console.log(`Status:   ${user.status}`);
    console.log('2FA status: Pending (TOTP will be provisioned on first login)');
    console.log('==================================================\n');
  } catch (e) {
    console.error('Error creating Super Admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
