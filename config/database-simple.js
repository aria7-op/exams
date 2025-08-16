const { Pool } = require('pg');
const logger = require('./logger');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.pool = new Pool({
                user: 'exam_user',
                host: 'localhost',
                database: 'exam_system',
                password: 'YourSecurePassword123!',
                port: 5432,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            logger.info('Database connected successfully');
        } catch (error) {
            logger.error('Database connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            logger.info('Database disconnected');
        }
    }

    async query(text, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            logger.debug('Database query executed', {
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration,
                rowCount: result.rowCount
            });

            return result;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Helper methods for common operations
    async findOne(table, conditions = {}) {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        
        const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
        const result = await this.query(query, values);
        return result.rows[0] || null;
    }

    async findMany(table, conditions = {}, options = {}) {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        let query = `SELECT * FROM ${table}`;
        
        if (keys.length > 0) {
            const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
            query += ` WHERE ${whereClause}`;
        }

        if (options.orderBy) {
            query += ` ORDER BY ${options.orderBy}`;
        }

        if (options.limit) {
            query += ` LIMIT ${options.limit}`;
        }

        if (options.offset) {
            query += ` OFFSET ${options.offset}`;
        }

        const result = await this.query(query, values);
        return result.rows;
    }

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        // Quote column names to preserve case
        const quotedKeys = keys.map(key => `"${key}"`);
        
        const query = `INSERT INTO ${table} (${quotedKeys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.query(query, values);
        return result.rows[0];
    }

    async update(table, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        
        const query = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await this.query(query, [...values, id]);
        return result.rows[0];
    }

    async delete(table, id) {
        const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
        const result = await this.query(query, [id]);
        return result.rows[0];
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW() as timestamp, version() as version');
            return {
                status: 'healthy',
                timestamp: result.rows[0].timestamp,
                version: result.rows[0].version.split(' ')[0]
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService; 