'use client';

import { Button, Form, Input } from 'antd';
import { signIn } from 'next-auth/react';
import React, { KeyboardEvent, useState } from 'react';

import { authService } from '@/services/auth/auth';

import {
  VerificationCodeInput,
  useCountdown,
  useVerificationStyles,
} from './VerificationComponents';

// 邮箱的正则表达式
const EMAIL_REGEX = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;

interface EmailSignInProps {
  callbackUrl: string;
}

export default function EmailSignIn({ callbackUrl }: EmailSignInProps) {
  const { styles } = useVerificationStyles();
  const [email, setEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 邮箱验证码状态
  const [showEmailVerificationCode, setShowEmailVerificationCode] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');

  // 使用自定义Hook管理倒计时
  const emailCountdownState = useCountdown();

  const [emailError, setEmailError] = useState('');

  // 验证函数
  const validateInput = (value: string): boolean => {
    if (!value) {
      setEmailError('');
      return false;
    }

    const isValid = EMAIL_REGEX.test(value);
    setEmailError(isValid ? '' : '请输入有效的邮箱地址');
    return isValid;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError('');
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!validateInput(email)) return;

    const result = await authService.sendEmailVerificationCode(email);

    if (result.success) {
      // 成功发送验证码，显示提示信息
      console.log('验证码已发送到邮箱');
    } else {
      // 显示错误信息
      setEmailError(result.message);
    }
  };

  // 重新获取验证码
  const handleResendCode = () => {
    if (!validateInput(email)) return;
    if (!emailCountdownState.isCounting) {
      sendVerificationCode();
      emailCountdownState.startCountdown();
    }
  };

  const handleContinue = () => {
    // 在继续前验证输入
    if (!validateInput(email)) return;

    if (showEmailVerificationCode) {
      // 如果已经显示验证码输入框，则执行登录
      setIsLoggingIn(true);
      if (email && emailVerificationCode) {
        signIn('email', { code: emailVerificationCode, email, redirectTo: callbackUrl })
          .then(() => {
            setIsLoggingIn(false);
          })
          .catch(() => {
            setIsLoggingIn(false);
          });
      }
    } else {
      // 显示邮箱验证码输入框并发送验证码
      setShowEmailVerificationCode(true);
      emailCountdownState.startCountdown();
      sendVerificationCode();
    }
  };

  // 判断继续按钮是否可用
  const isContinueDisabled = Boolean(
    !email || emailError || (showEmailVerificationCode && !emailVerificationCode),
  );

  // 处理回车键事件
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isContinueDisabled) {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div>
      <Form.Item
        className={styles.formItem}
        help={emailError}
        validateStatus={emailError ? 'error' : ''}
      >
        <Input
          autoFocus
          disabled={emailCountdownState.isCounting}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="请输入邮箱地址"
          value={email}
        />
      </Form.Item>

      <VerificationCodeInput
        countdown={emailCountdownState.countdown}
        isCountingDown={emailCountdownState.isCounting}
        onKeyDown={handleKeyPress}
        onResend={handleResendCode}
        setVerificationCode={setEmailVerificationCode}
        showVerificationCode={showEmailVerificationCode}
        styles={styles}
        verificationCode={emailVerificationCode}
      />

      <div className={styles.buttonContainer}>
        <Button
          block
          disabled={isContinueDisabled}
          loading={isLoggingIn}
          onClick={handleContinue}
          type={'primary'}
        >
          {showEmailVerificationCode ? '登录' : '继续 ›'}
        </Button>
      </div>
    </div>
  );
}
