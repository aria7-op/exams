const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

class Database {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
  }

  async connect() {
    try {
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
      await this.prisma.$connect();
      
      this.isConnected = true;
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