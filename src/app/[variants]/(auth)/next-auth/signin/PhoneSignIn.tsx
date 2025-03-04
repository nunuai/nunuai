'use client';

import { Button, Form, Input } from 'antd';
import { signIn } from 'next-auth/react';
import React, { KeyboardEvent, useState } from 'react';

import { authService } from '@/services/auth/auth';

import { VerificationCodeInput, useCountdown, useVerificationStyles } from './VerificationComponents';

// 手机号的正则表达式
const PHONE_REGEX = /^1[3-9]\d{9}$/;

interface PhoneSignInProps {
  callbackUrl: string;
}

export default function PhoneSignIn({ callbackUrl }: PhoneSignInProps) {
  const { styles } = useVerificationStyles();
  const [phone, setPhone] = useState('');
  const [, setIsLoggingIn] = useState(false);

  // 手机验证码状态
  const [showPhoneVerificationCode, setShowPhoneVerificationCode] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');

  // 使用自定义Hook管理倒计时
  const phoneCountdownState = useCountdown();

  const [phoneError, setPhoneError] = useState('');

  // 验证函数
  const validateInput = (value: string): boolean => {
    if (!value) {
      setPhoneError('');
      return false;
    }

    const isValid = PHONE_REGEX.test(value);
    setPhoneError(isValid ? '' : '请输入有效的手机号');
    return isValid;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (phoneError) setPhoneError('');
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!validateInput(phone)) return;

    const result = await authService.sendSmsVerificationCode(phone);

    if (result.success) {
      // 成功发送验证码，显示提示信息
      console.log('验证码已发送到手机');
    } else {
      // 显示错误信息
      setPhoneError(result.message);
    }
  };

  // 重新获取验证码
  const handleResendCode = () => {
    if (!validateInput(phone)) return;
    if (!phoneCountdownState.isCounting) {
      sendVerificationCode();
      phoneCountdownState.startCountdown();
    }
  };

  const handleContinue = () => {
    // 在继续前验证输入
    if (!validateInput(phone)) return;

    if (showPhoneVerificationCode) {
      // 如果已经显示验证码输入框，则执行登录
      setIsLoggingIn(true);
      if (phone && phoneVerificationCode) {
        signIn('sms', { code: phoneVerificationCode, phone, redirectTo: callbackUrl })
          .then((result) => {
            console.log('===111===登录成功', result);
          })
          .catch((error) => {
            console.log('===111===登录失败', error);
          });
      }
    } else {
      // 显示手机验证码输入框并发送验证码
      setShowPhoneVerificationCode(true);
      phoneCountdownState.startCountdown();
      sendVerificationCode();
    }
  };

  // 判断继续按钮是否可用
  const isContinueDisabled = Boolean(
    !phone || phoneError || (showPhoneVerificationCode && !phoneVerificationCode)
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
        help={phoneError}
        validateStatus={phoneError ? 'error' : ''}
      >
        <Input
          autoFocus
          disabled={phoneCountdownState.isCounting}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="请输入手机号"
          prefix={<span className={styles.phonePrefix}>+86</span>}
          value={phone}
        />
      </Form.Item>

      <VerificationCodeInput
        countdown={phoneCountdownState.countdown}
        isCountingDown={phoneCountdownState.isCounting}
        onKeyDown={handleKeyPress}
        onResend={handleResendCode}
        setVerificationCode={setPhoneVerificationCode}
        showVerificationCode={showPhoneVerificationCode}
        styles={styles}
        verificationCode={phoneVerificationCode}
      />

      <div className={styles.buttonContainer}>
        <Button block disabled={isContinueDisabled} onClick={handleContinue} type={'primary'}>
          {showPhoneVerificationCode ? '登录' : '继续 ›'}
        </Button>
      </div>
    </div>
  );
} 