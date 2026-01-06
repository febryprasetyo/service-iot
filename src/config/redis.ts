import { Redis } from 'ioredis';
import 'dotenv/config';
import { logger } from '../utils/util';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};

const connection = new Redis(redisConfig);

connection.on('connect', () => {
    logger.info('[REDIS] Connected successfully');
});

connection.on('error', (err) => {
    logger.error(`[REDIS] Error: ${err}`);
});

export default connection;