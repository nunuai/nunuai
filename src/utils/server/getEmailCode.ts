import Dm20151123, * as $Dm20151123 from '@alicloud/dm20151123';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 阿里云邮件API错误接口
 */
interface AlibabaEmailError extends Error {
  data?: {
    [key: string]: any;
    Recommend?: string;
  };
  message: string;
}

/**
 * 创建阿里云邮件客户端
 * @returns Dm20151123 客户端实例
 */
function createEmailClient(): Dm20151123 {
  // 建议使用更安全的 STS 方式进行身份验证
  // 参考: https://help.aliyun.com/document_detail/378664.html
  const config = new $OpenApi.Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  });

  // 邮件服务的端点
  config.endpoint = 'dm.aliyuncs.com';

  return new Dm20151123(config);
}

/**
 * 邮箱验证码选项接口
 */
interface SendEmailVerificationCodeOptions {
  // 收件人邮箱
  accountName?: string;
  code?: string;
  // 可选: 如果不提供，将生成随机验证码
  email: string; // 发件人账号，默认使用环境变量中的配置
  subject?: string; // 邮件主题，默认为"【nunuai】您的验证码"
  tagName?: string; // 标签名称，用于统计
}

/**
 * 生成随机验证码
 * @param length 验证码长度 (默认: 6)
 * @returns 随机数字验证码
 */
export function generateVerificationCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * 生成验证码邮件的HTML内容
 * @param code 验证码
 * @returns HTML格式的邮件内容
 */
function generateEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>nunuai 验证码</title>
    <style>
        body {
            font-family: "Helvetica Neue", Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 40px 0;
            display: flex;
            justify-content: center;
        }
        .container {
            max-width: 480px;
            background: #ffffff;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #222;
            letter-spacing: 2px;
            margin-bottom: 24px;
        }
        .message {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            letter-spacing: 4px;
            margin: 24px 0;
            padding: 12px 24px;
            display: inline-block;
            background: #f5f5f5;
            border-radius: 8px;
        }
        .footer {
            font-size: 12px;
            color: #999;
            margin-top: 24px;
        }
        a {
            color: #555;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            color: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔹 nunuai</div>
        <p class="message">👋 亲爱的用户，您好！</p>
        <p class="message">您正在使用 <strong>nunuai</strong> 进行身份验证，您的验证码如下：</p>
        <div class="code">🔢 ${code}</div>
        <p class="message">⚠️ 请勿泄露此验证码，它将在 <strong>5 分钟</strong> 内失效。</p>
        <p class="message">如果您未发起此请求，请忽略此邮件，无需任何操作。</p>
        <div class="footer">
            🚀 感谢您使用 <strong>nunuai</strong>！<br>
            🌍 <a href="https://nunuai.com" target="_blank">nunuai.com</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * 通过阿里云邮件服务发送验证码邮件
 * @param options 发送验证码邮件的选项
 * @returns 包含结果和发送的验证码的对象
 */
export async function getEmailVerificationCode(options: SendEmailVerificationCodeOptions): Promise<{
  code: string;
  message?: string;
  requestId?: string;
  success: boolean;
}> {
  const { email } = options;
  const code = options.code || generateVerificationCode();
  const accountName =
    options.accountName || process.env.ALIBABA_EMAIL_ACCOUNT || 'nunu01@nunuai.com';
  const subject = options.subject || '🔐【nunuai】您的验证码';
  const tagName = options.tagName || 'verification';

  const client = createEmailClient();
  const singleSendMailRequest = new $Dm20151123.SingleSendMailRequest({
    accountName: accountName,
    addressType: 1,
    htmlBody: generateEmailHtml(code),
    replyToAddress: true,
    subject: subject,
    tagName: tagName,
    toAddress: email,
  });

  const runtime = new $Util.RuntimeOptions({});

  try {
    // 发送邮件
    const response = await client.singleSendMailWithOptions(singleSendMailRequest, runtime);

    return {
      code,
      message: 'Email sent successfully',
      requestId: response.body?.requestId,
      success: response.statusCode === 200,
    };
  } catch (error: unknown) {
    const emailError = error as AlibabaEmailError;
    console.error('发送邮件失败:', emailError.message);
    if (emailError.data && emailError.data.Recommend) {
      console.error('建议:', emailError.data.Recommend);
    }

    return {
      code,
      message: emailError.message,
      success: false,
    };
  }
}

/**
 * 发送邮箱验证码并存储到Redis
 * @param email 邮箱地址
 * @param expireTime 过期时间（秒），默认300秒
 * @returns 发送结果
 */
export async function sendEmailVerificationCode(
  email: string,
  expireTime: number = 300,
): Promise<{
  message?: string;
  success: boolean;
}> {
  try {
    // 导入Redis工具
    const { emailVerificationCodeRedis } = await import('./redis');

    // 生成并发送验证码
    const result = await getEmailVerificationCode({ email });

    if (result.success) {
      // 将验证码存储到Redis
      await emailVerificationCodeRedis.storeCode(email, result.code, expireTime);
      return {
        message: '验证码已发送到您的邮箱',
        success: true,
      };
    } else {
      return {
        message: `发送失败: ${result.message || '未知错误'}`,
        success: false,
      };
    }
  } catch (error) {
    console.error('发送邮箱验证码失败:', error);
    return {
      message: error instanceof Error ? error.message : '发送验证码时发生未知错误',
      success: false,
    };
  }
}
