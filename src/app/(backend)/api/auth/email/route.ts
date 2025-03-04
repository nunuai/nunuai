import { NextRequest, NextResponse } from 'next/server';

import { sendEmailVerificationCode } from '@/utils/server/getEmailCode';
import { emailVerificationCodeRedis } from '@/utils/server/redis';

// 验证码有效期（秒）
const CODE_EXPIRE_TIME = 300; // 5分钟

/**
 * 发送邮箱验证码
 * @route POST /api/auth/email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // 验证邮箱格式
    const EMAIL_REGEX = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ message: '请输入有效的邮箱地址', success: false }, { status: 400 });
    }

    // 发送验证码
    const result = await sendEmailVerificationCode(email, CODE_EXPIRE_TIME);

    if (!result.success) {
      console.error('发送邮箱验证码失败:', result.message);
      return NextResponse.json(
        { message: '发送验证码失败，请稍后再试', success: false },
        { status: 500 },
      );
    }

    // 返回成功响应
    return NextResponse.json({
      message: '验证码已发送到您的邮箱',
      success: true,
    });
  } catch (error) {
    console.error('邮箱验证码API错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试', success: false },
      { status: 500 },
    );
  }
}

/**
 * 验证邮箱验证码
 * @route GET /api/auth/email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      return NextResponse.json(
        { message: '邮箱和验证码不能为空', success: false },
        { status: 400 },
      );
    }

    // 从 Redis 获取验证码并验证
    const isValid = await emailVerificationCodeRedis.verifyCode(email, code);

    if (!isValid) {
      return NextResponse.json({ message: '验证码无效或已过期', success: false }, { status: 400 });
    }

    // 验证成功后，删除 Redis 中的验证码
    await emailVerificationCodeRedis.deleteCode(email);

    return NextResponse.json({
      message: '验证码验证成功',
      success: true,
    });
  } catch (error) {
    console.error('邮箱验证码验证错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试', success: false },
      { status: 500 },
    );
  }
} 