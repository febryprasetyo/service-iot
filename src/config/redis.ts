import * as redis from 'redis'
import 'dotenv/config';

const redisClient: any = redis.createClient({
  url: `redis://${process.env.REDIS_PASSWORD}@${process.env.REDIS_URI}:${process.env.REDIS_PORT}`,
})

export = redisClient