const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    console.log('👥 Creating users...');
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    // Create users
    const users = [
      {
        id: 'cmdw3a9vs0000i2jijo7g0t4t',
        email: 'admin@mocktest.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      },
      {
        id: 'admin_001',
        email: 'admin1@mocktest.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      },
      {
        id: 'moderator_001',
        email: 'moderator@mocktest.com',
        password: hashedPassword,
        firstName: 'Moderator',
        lastName: 'User',
        role: 'MODERATOR',
        isActive: true,
        isEmailVerified: true
      },
      {
        id: 'student_001',
        email: 'student1@example.com',
        password: hashedPassword,
        firstName: 'Student',
        lastName: 'User',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
      console.log(`✅ Created user: ${user.email}`);
    }

    // Get user count for summary
    const userCount = await prisma.user.count();

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Seeding Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log('🔐 Default Login Credentials:');
    console.log('   • Super Admin: admin@mocktest.com / Admin@123');
    console.log('   • Admin: admin1@mocktest.com / Admin@123');
    console.log('   • Moderator: moderator@mocktest.com / Admin@123');
    console.log('   • Student: student1@example.com / Admin@123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 