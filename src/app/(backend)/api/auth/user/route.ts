import { NextRequest, NextResponse } from 'next/server';

import { userSettings } from '@/database/schemas';
import { serverDB } from '@/database/server';
import { UserModel } from '@/database/server/models/user';

/**
 * 创建或获取用户
 * @route POST /api/auth/user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, phone, username, firstName, lastName, fullName } = body;

    if (!id || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields', success: false },
        { status: 400 },
      );
    }

    // 先尝试查找用户
    const existingUser = await serverDB.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (existingUser) {
      // 确保用户设置存在
      const existingSettings = await serverDB.query.userSettings.findFirst({
        where: (settings, { eq }) => eq(settings.id, id),
      });

      if (!existingSettings) {
        // 如果用户存在但设置不存在，创建设置
        await serverDB.insert(userSettings).values({
          defaultAgent: {},
          general: {},
          id,
          keyVaults: null,
          languageModel: {},
          systemAgent: {},
          tool: {},
          tts: {},
        });
      }

      console.log('===111===找到已存在用户:', existingUser);
      return NextResponse.json(existingUser);
    }

    // 如果用户不存在，创建新用户
    const newUser = await UserModel.createUser(serverDB, {
      avatar: null,
      email: null,
      firstName: firstName || 'user',
      fullName: fullName || `user_${phone.slice(-4)}`,
      id,
      lastName: lastName || phone.slice(-4),
      phone,
      username: username || `user_${phone.slice(-4)}`,
    });

    // 同时创建用户设置
    await serverDB.insert(userSettings).values({
      defaultAgent: {},
      general: {},
      id,
      keyVaults: null,
      languageModel: {},
      systemAgent: {},
      tool: {},
      tts: {},
    });

    console.log('===111===创建新用户:', newUser);
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('用户操作失败:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试', success: false },
      { status: 500 },
    );
  }
}
