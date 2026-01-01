import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdmin() {
  const adminEmail = process.argv[2] || 'admin@cravio.com';
  const adminName = process.argv[3] || 'Admin User';
  const adminId = process.argv[4] || 'ADMIN001';

  try {
    console.log(`Creating admin user: ${adminEmail}`);

    // First create or update the user with ADMIN role
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        role: 'ADMIN'
      },
      create: {
        email: adminEmail,
        name: adminName,
        role: 'ADMIN'
      }
    });

    console.log('User created/updated:', user);

    // Then create the admin record
    const admin = await prisma.admin.upsert({
      where: { userId: user.id },
      update: {
        adminId: adminId,
        level: 1
      },
      create: {
        userId: user.id,
        adminId: adminId,
        level: 1
      }
    });

    console.log('Admin record created/updated:', admin);
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Admin ID: ${adminId}`);
    console.log(`User ID: ${user.id}`);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

