const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Read and execute the init.sql file
    const initSqlPath = path.join(__dirname, '..', 'database', 'init.sql');
    
    if (fs.existsSync(initSqlPath)) {
      console.log('📄 Loading data from init.sql...');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      
      // Split the SQL file into individual statements
      const statements = initSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await prisma.$executeRawUnsafe(statement);
          } catch (error) {
            // Ignore errors for duplicate entries or existing data
            if (!error.message.includes('duplicate key') && !error.message.includes('already exists')) {
              console.warn('⚠️  SQL statement failed:', error.message);
            }
          }
        }
      }
    }

    // Create additional sample data if needed
    console.log('📊 Creating additional sample data...');

    // Check if we have any exam categories
    const existingCategories = await prisma.examCategory.findMany();
    
    if (existingCategories.length === 0) {
      console.log('📝 Creating exam categories...');
      
      const categories = [
        {
          id: 'cat_001',
          name: 'Mathematics',
          description: 'Advanced mathematics including algebra, calculus, and statistics',
          icon: 'calculator',
          color: '#FF6B6B',
          isActive: true,
          sortOrder: 1
        },
        {
          id: 'cat_002',
          name: 'Physics',
          description: 'Classical and modern physics concepts',
          icon: 'atom',
          color: '#4ECDC4',
          isActive: true,
          sortOrder: 2
        },
        {
          id: 'cat_003',
          name: 'Chemistry',
          description: 'Organic and inorganic chemistry',
          icon: 'flask',
          color: '#45B7D1',
          isActive: true,
          sortOrder: 3
        },
        {
          id: 'cat_004',
          name: 'Biology',
          description: 'Life sciences and biological concepts',
          icon: 'dna',
          color: '#96CEB4',
          isActive: true,
          sortOrder: 4
        },
        {
          id: 'cat_005',
          name: 'Computer Science',
          description: 'Programming, algorithms, and computer systems',
          icon: 'code',
          color: '#FFEAA7',
          isActive: true,
          sortOrder: 5
        }
      ];

      for (const category of categories) {
        await prisma.examCategory.upsert({
          where: { id: category.id },
          update: {},
          create: category
        });
      }
    }

    // Check if we have any exams
    const existingExams = await prisma.exam.findMany();
    
    if (existingExams.length === 0) {
      console.log('📝 Creating sample exams...');
      
      const exams = [
        {
          id: 'exam_001',
          title: 'Basic Mathematics Test',
          description: 'A comprehensive test covering fundamental mathematics concepts including algebra, geometry, and basic calculus.',
          examCategoryId: 'cat_001',
          duration: 60,
          totalMarks: 10,
          passingMarks: 6,
          price: 9.99,
          currency: 'USD',
          isActive: true,
          isPublic: true,
          allowRetakes: true,
          maxRetakes: 3,
          showResults: true,
          showAnswers: false,
          randomizeQuestions: true,
          randomizeOptions: true,
          questionOverlapPercentage: 10.0,
          createdBy: 'cmdw3a9vs0000i2jijo7g0t4t' // Super Admin ID
        },
        {
          id: 'exam_002',
          title: 'Physics Fundamentals',
          description: 'Basic physics concepts and principles including mechanics, thermodynamics, and wave phenomena.',
          examCategoryId: 'cat_002',
          duration: 45,
          totalMarks: 6,
          passingMarks: 4,
          price: 7.99,
          currency: 'USD',
          isActive: true,
          isPublic: true,
          allowRetakes: true,
          maxRetakes: 3,
          showResults: true,
          showAnswers: false,
          randomizeQuestions: true,
          randomizeOptions: true,
          questionOverlapPercentage: 10.0,
          createdBy: 'cmdw3a9vs0000i2jijo7g0t4t'
        },
        {
          id: 'exam_003',
          title: 'Chemistry Basics',
          description: 'Introduction to chemistry concepts including atomic structure, chemical bonding, and reactions.',
          examCategoryId: 'cat_003',
          duration: 45,
          totalMarks: 6,
          passingMarks: 4,
          price: 7.99,
          currency: 'USD',
          isActive: true,
          isPublic: true,
          allowRetakes: true,
          maxRetakes: 3,
          showResults: true,
          showAnswers: false,
          randomizeQuestions: true,
          randomizeOptions: true,
          questionOverlapPercentage: 10.0,
          createdBy: 'cmdw3a9vs0000i2jijo7g0t4t'
        },
        {
          id: 'exam_004',
          title: 'Computer Science Introduction',
          description: 'Basic programming and computer science concepts including algorithms, data structures, and web technologies.',
          examCategoryId: 'cat_005',
          duration: 60,
          totalMarks: 8,
          passingMarks: 5,
          price: 12.99,
          currency: 'USD',
          isActive: true,
          isPublic: true,
          allowRetakes: true,
          maxRetakes: 3,
          showResults: true,
          showAnswers: false,
          randomizeQuestions: true,
          randomizeOptions: true,
          questionOverlapPercentage: 10.0,
          createdBy: 'cmdw3a9vs0000i2jijo7g0t4t'
        }
      ];

      for (const exam of exams) {
        await prisma.exam.upsert({
          where: { id: exam.id },
          update: {},
          create: exam
        });
      }
    }

    // Get counts for summary
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.examCategory.count();
    const examCount = await prisma.exam.count();
    const questionCount = await prisma.question.count();

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Seeding Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Exam Categories: ${categoryCount}`);
    console.log(`   • Questions: ${questionCount}`);
    console.log(`   • Exams: ${examCount}`);
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