import { NextRequest, NextResponse } from 'next/server';

import { getVerificationCode } from '@/utils/server/getCode';
import { verificationCodeRedis } from '@/utils/server/redis';

// 验证码有效期（秒）
const CODE_EXPIRE_TIME = 300; // 5分钟

/**
 * 发送短信验证码
 * @route POST /api/auth/sms
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    // 验证手机号格式
    const PHONE_REGEX = /^1[3-9]\d{9}$/;
    if (!phoneNumber || !PHONE_REGEX.test(phoneNumber)) {
      return NextResponse.json({ message: '请输入有效的手机号', success: false }, { status: 400 });
    }

    // 发送验证码
    const result = await getVerificationCode({
      phoneNumber,
      signName: process.env.ALIBABA_CLOUD_SMS_SIGN_NAME || '',
      templateCode: process.env.ALIBABA_CLOUD_SMS_TEMPLATE_CODE || '',
    });

    if (!result.success) {
      console.error('Failed to send SMS:', result.message);
      return NextResponse.json(
        { message: '发送验证码失败，请稍后再试', success: false },
        { status: 500 },
      );
    }

    // 存储验证码到 Redis
    await verificationCodeRedis.storeCode(phoneNumber, result.code, CODE_EXPIRE_TIME);

    // 返回成功响应
    return NextResponse.json({
      // 移除验证码返回，确保安全性
      message: '验证码已发送',
      success: true,
    });
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试', success: false },
      { status: 500 },
    );
  }
}

/**
 * 验证短信验证码
 * @route GET /api/auth/sms
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const code = searchParams.get('code');

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { message: '手机号和验证码不能为空', success: false },
        { status: 400 },
      );
    }

    // 从 Redis 获取验证码并验证
    const isValid = await verificationCodeRedis.verifyCode(phoneNumber, code);

    if (!isValid) {
      return NextResponse.json({ message: '验证码无效或已过期', success: false }, { status: 400 });
    }

    // 验证成功后，删除 Redis 中的验证码
    await verificationCodeRedis.deleteCode(phoneNumber);

    return NextResponse.json({
      message: '验证码验证成功',
      success: true,
    });
  } catch (error) {
    console.error('SMS verification error:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试', success: false },
      { status: 500 },
    );
  }
}
