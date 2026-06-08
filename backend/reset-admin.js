const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const newUsername = 'admin'; // You can change this
  const newPassword = 'admin'; // You can change this
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Check if an admin already exists
  let admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (admin) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        username: newUsername,
        password: hashedPassword,
      }
    });
    console.log(`Admin user updated! Username: ${newUsername}, Password: ${newPassword}`);
  } else {
    admin = await prisma.user.create({
      data: {
        username: newUsername,
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'admin',
        permissions: 'all'
      }
    });
    console.log(`Admin user created! Username: ${newUsername}, Password: ${newPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
