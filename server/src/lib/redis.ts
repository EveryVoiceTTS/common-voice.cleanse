import * as Redis from 'ioredis';
import * as Redlock from 'redlock';
import { getConfig } from '../config-helper';

// [connecting to AWS ElasticCache](https://github.com/luin/ioredis/issues/689#issuecomment-442366445)
export const redis = new Redis({
   host: getConfig().REDIS_URL,
   port: 6379,
   tls: {
      rejectUnauthorized: false,
      // https://stackoverflow.com/a/69758100
      //checkServerIdentity: () => undefined,
   },
});

export const redlock = new Redlock([redis], { retryCount: -1 });

export const useRedis = new Promise(resolve => {
  redis.on('ready', () => {
    console.log('useRedis: Using Redis');
    resolve(true);
  });
  redis.on('error', err => {
    console.log(`ERROR: Redis failed to connect to ${getConfig().REDIS_URL} with error: ${err}`);
    resolve(false);
    return redis.quit();
  });
}).then(val => {
  console.log('Cache is', val ? 'redis' : 'in-memory');
  return val;
});
