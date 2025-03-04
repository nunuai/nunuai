/**
 * 认证相关服务
 */

/**
 * 验证码接口返回类型
 */
interface VerificationCodeResponse {
  code?: string;
  message: string;
  success: boolean;
}

/**
 * 认证服务类
 */
class AuthService {
  /**
   * 发送短信验证码
   * @param phoneNumber 手机号
   * @returns 发送结果
   */
  sendSmsVerificationCode = async (
    phoneNumber: string,
  ): Promise<VerificationCodeResponse> => {
    try {
      const response = await fetch('/api/auth/sms', {
        body: JSON.stringify({ phoneNumber }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('发送短信验证码失败:', error);
      return { message: '发送验证码失败，请稍后再试', success: false };
    }
  };

  /**
   * 发送邮箱验证码
   * @param email 邮箱地址
   * @returns 发送结果
   */
  sendEmailVerificationCode = async (
    email: string,
  ): Promise<VerificationCodeResponse> => {
    try {
      const response = await fetch('/api/auth/email', {
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('发送邮箱验证码失败:', error);
      return { message: '发送验证码失败，请稍后再试', success: false };
    }
  };
}

export const authService = new AuthService(); 