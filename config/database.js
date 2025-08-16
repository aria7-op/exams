const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

class Database {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('🔌 Attempting database connection...');
      console.log('🔌 Database URL:', process.env.DATABASE_URL || 'Not set');
      
      this.prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Test the connection
      console.log('🔌 Testing database connection...');
      await this.prisma.$connect();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully via Prisma');
      logger.info('Database connected successfully via Prisma');

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        this.prisma.$on('query', (e) => {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      // Log errors
      this.prisma.$on('error', (e) => {
        logger.error('Prisma Error', {
          message: e.message,
          target: e.target,
        });
      });

      return this.prisma;
    } catch (error) {
      console.log('💥 Database connection failed:', error);
      console.log('💥 Database error stack:', error.stack);
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  getPrisma() {
    return this.prisma;
  }

  isConnected() {
    return this.isConnected;
  }

  // Check if database is actually connected and working
  async healthCheck() {
    try {
      if (!this.prisma) {
        return { status: 'disconnected', message: 'Prisma client not initialized' };
      }
      
      // Try a simple query to test the connection
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'connected', message: 'Database is responding' };
    } catch (error) {
      console.log('💥 Database health check failed:', error);
      return { status: 'error', message: error.message, error };
    }
  }

  // Helper method for transactions
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }

  // Helper method for raw queries when needed
  async rawQuery(query, params = []) {
    return this.prisma.$queryRawUnsafe(query, ...params);
  }

  // Helper method for executing raw SQL
  async executeRaw(query, params = []) {
    return this.prisma.$executeRawUnsafe(query, ...params);
  }
}

module.exports = new Database(); 