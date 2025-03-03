/**
 * Redis 客户端工具
 *
 * 使用 ioredis 连接 Redis 服务器
 * 配置信息从环境变量中获取：
 * REDIS_URL=redis://localhost:6379
 * 或者
 * REDIS_HOST=localhost
 * REDIS_PORT=6379
 * REDIS_PASSWORD=your_password (如果有密码)
 */
import Redis from 'ioredis';

// 防止开发环境下热重载导致的多次连接创建
// 使用全局变量保存 Redis 客户端实例
declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined;
}

// 创建 Redis 客户端
const createRedisClient = (): Redis => {
  // 优先使用 REDIS_URL
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL);
  }

  // 否则使用分开的配置
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    maxRetriesPerRequest: 3,
    password: process.env.REDIS_PASSWORD,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times) => {
      // 最多重试 3 次，每次间隔 1000ms
      return times >= 3 ? null : 1000;
    },
  });
};

// 获取或创建 Redis 客户端
export const getRedisClient = (): Redis => {
  // 在开发环境中使用全局变量保存实例，避免热重载导致的多次连接
  if (process.env.NODE_ENV === 'development') {
    if (!global.redisClient) {
      global.redisClient = createRedisClient();

      // 监听错误事件
      global.redisClient.on('error', (err: Error) => {
        console.error('Redis 连接错误:', err);
      });
    }
    return global.redisClient;
  }

  // 在生产环境中直接创建新实例
  const redis = createRedisClient();

  // 监听错误事件
  redis.on('error', (err: Error) => {
    console.error('Redis 连接错误:', err);
  });

  return redis;
};

// 导出 Redis 客户端实例
export const redis = getRedisClient();

/**
 * 验证码相关的 Redis 操作
 */
export const verificationCodeRedis = {
  /**
   * 删除验证码
   * @param phoneNumber 手机号
   */
  async deleteCode(phoneNumber: string): Promise<void> {
    const key = `sms:${phoneNumber}`;
    await redis.del(key);
  },

  /**
   * 获取验证码
   * @param phoneNumber 手机号
   * @returns 验证码，如果不存在或已过期则返回 null
   */
  async getCode(phoneNumber: string): Promise<string | null> {
    const key = `sms:${phoneNumber}`;
    return redis.get(key);
  },

  /**
   * 存储验证码
   * @param phoneNumber 手机号
   * @param code 验证码
   * @param expireTime 过期时间（秒）
   */
  async storeCode(phoneNumber: string, code: string, expireTime: number = 300): Promise<void> {
    const key = `sms:${phoneNumber}`;
    await redis.set(key, code, 'EX', expireTime);
  },

  /**
   * 验证验证码
   * @param phoneNumber 手机号
   * @param code 验证码
   * @returns 是否有效
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const storedCode = await this.getCode(phoneNumber);
    return storedCode === code;
  },
};
