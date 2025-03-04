// 阿里云邮箱验证
import CredentialsProvider from 'next-auth/providers/credentials';

import { CommonProviderConfig } from './sso.config';

/**
 * 验证邮箱验证码
 * @param email 邮箱地址
 * @param code 验证码
 * @returns 是否有效
 */
async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  try {
    // 在服务器端，我们需要使用绝对 URL
    // 从环境变量获取基础 URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';
    // 构建完整的 API URL
    const apiUrl = new URL('/api/auth/email', baseUrl);
    // 添加查询参数
    apiUrl.searchParams.append('email', email);
    apiUrl.searchParams.append('code', code);

    // 使用完整的 URL 进行请求
    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    return data.success;
  } catch (error) {
    console.error('验证码验证失败:', error);
    return false;
  }
}

/**
 * 获取或创建用户
 * @param email 邮箱地址
 * @returns 用户信息
 */
async function getOrCreateUser(email: string) {
  try {
    // 构建 API URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';
    const apiUrl = new URL('/api/auth/user', baseUrl);

    // 发送请求创建或获取用户
    const response = await fetch(apiUrl, {
      body: JSON.stringify({
        email,
        id: email,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to get or create user');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('获取或创建用户失败:', error);
    throw error;
  }
}

const provider = {
  id: 'email',
  provider: CredentialsProvider({
    ...CommonProviderConfig,

    async authorize(credentials) {
      const { email, code } = credentials as { code?: string; email?: string };

      if (!email || !code) {
        throw new Error('Missing email or code');
      }

      // 验证邮箱验证码
      const isValid = await verifyEmailCode(email, code);
      if (!isValid) {
        throw new Error('Invalid code');
      }

      // 获取或创建用户
      const user = await getOrCreateUser(email);
      if (!user) {
        throw new Error('Failed to get or create user');
      }

      // 返回用户信息
      return {
        avatar: user.avatar || null,
        email: user.email || email,
        firstName: user.firstName || null,
        fullName: user.fullName || null,
        id: user.id,
        lastName: user.lastName || null,
        phone: user.phone || null,
        username: user.username || email.split('@')[0],
      };
    },
    credentials: {
      code: { label: '验证码', type: 'text' },
      email: { label: '邮箱', type: 'text' },
    },
    id: 'email',
    name: 'email',
  }),
};

export default provider;
