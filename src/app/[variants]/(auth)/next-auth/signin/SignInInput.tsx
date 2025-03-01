'use client';

import { Button, Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import { signIn } from 'next-auth/react';
import React, { KeyboardEvent, useEffect, useState } from 'react';

// 邮箱和手机号的正则表达式
const EMAIL_REGEX = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

const useStyles = createStyles(({ css, token }) => ({
  buttonContainer: css`
    margin-block-start: 20px;
  `,
  formItem: css`
    margin-block-end: 8px;

    .ant-form-item-explain {
      height: 12px;
      margin-block-start: 5px;
    }

    .ant-form-item-explain-error {
      font-size: 12px;
      line-height: 1;
    }
  `,
  loginTypeActive: css`
    position: relative;
    font-weight: 600;
    color: ${token.colorPrimary};

    &::after {
      content: '';

      position: absolute;
      inset-block-end: -4px;
      inset-inline-start: 0;

      width: 100%;
      height: 2px;
      border-radius: 2px;

      background-color: ${token.colorPrimary};
    }
  `,
  loginTypeContainer: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 20px;
  `,
  loginTypeOption: css`
    cursor: pointer;

    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 14px;
    color: ${token.colorTextSecondary};

    &:hover {
      font-weight: 600;
      color: ${token.colorPrimary};
    }
  `,
  phonePrefix: css`
    margin-inline-end: 4px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
  `,
  verificationCodeAnimation: css`
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition:
      max-height 0.35s ease,
      opacity 0.35s ease;

    &.show {
      max-height: 100px; /* 足够容纳验证码输入框的高度 */
      opacity: 1;
    }
  `,
  verificationCodeButton: css`
    cursor: pointer;

    margin-block-start: 5px;

    font-size: 12px;
    line-height: 1;
    color: ${token.colorPrimary};
    text-align: center;
    white-space: nowrap;

    &:hover {
      color: ${token.colorPrimaryHover};
    }

    &.disabled {
      cursor: not-allowed;
      color: ${token.colorTextDisabled};
    }
  `,
}));

interface SignInInputProps {
  callbackUrl: string;
}

// 提取验证码输入组件
interface VerificationCodeInputProps {
  countdown: number;
  isCountingDown: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
  setVerificationCode: (code: string) => void;
  showVerificationCode: boolean;
  styles: ReturnType<typeof useStyles>['styles'];
  verificationCode: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  showVerificationCode,
  verificationCode,
  setVerificationCode,
  isCountingDown,
  countdown,
  onResend,
  styles,
  onKeyDown,
}) => {
  return (
    <div className={`${styles.verificationCodeAnimation} ${showVerificationCode ? 'show' : ''}`}>
      {showVerificationCode && (
        <Form.Item className={styles.formItem}>
          <Input
            autoFocus
            onChange={(e) => setVerificationCode(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="请输入验证码"
            value={verificationCode}
          />
          <div
            className={`${styles.verificationCodeButton} ${isCountingDown ? 'disabled' : ''}`}
            onClick={onResend}
          >
            {`没有收到验证码？重新发送(${countdown}s)`}
          </div>
        </Form.Item>
      )}
    </div>
  );
};

// 提取倒计时逻辑的自定义Hook
const useCountdown = (initialValue = 0) => {
  const [countdown, setCountdown] = useState(initialValue);
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isCounting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isCounting]);

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    setIsCounting(true);
  };

  return { countdown, isCounting, setIsCounting, startCountdown };
};

export default function SignInInput({ callbackUrl }: SignInInputProps) {
  const { styles } = useStyles();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginType, setLoginType] = useState('email'); // 'email' 或 'phone'
  const [, setIsLoggingIn] = useState(false);

  // 分开管理邮箱和手机的验证码状态
  const [showEmailVerificationCode, setShowEmailVerificationCode] = useState(false);
  const [showPhoneVerificationCode, setShowPhoneVerificationCode] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');

  // 使用自定义Hook管理倒计时
  const emailCountdownState = useCountdown();
  const phoneCountdownState = useCountdown();

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // 验证函数
  const validateInput = (value: string, type: 'email' | 'phone'): boolean => {
    if (!value) {
      if (type === 'email') {
        setEmailError('');
      } else {
        setPhoneError('');
      }
      return false;
    }

    const regex = type === 'email' ? EMAIL_REGEX : PHONE_REGEX;
    const errorMessage = type === 'email' ? '请输入有效的邮箱地址' : '请输入有效的手机号';
    const isValid = regex.test(value);

    if (type === 'email') {
      setEmailError(isValid ? '' : errorMessage);
    } else {
      setPhoneError(isValid ? '' : errorMessage);
    }

    return isValid;
  };

  // 验证当前输入
  const validateCurrentInput = (): boolean => {
    return loginType === 'email' ? validateInput(email, 'email') : validateInput(phone, 'phone');
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'email' | 'phone') => {
    const value = e.target.value;
    if (type === 'email') {
      setEmail(value);
      if (emailError) setEmailError('');
    } else {
      setPhone(value);
      if (phoneError) setPhoneError('');
    }
  };

  // 发送验证码
  const sendVerificationCode = (type: 'email' | 'phone') => {
    if (type === 'email') {
      console.log('发送邮箱验证码到:', email);
    } else {
      console.log('发送手机验证码到:', phone);
    }
    // 实际项目中应该调用API发送验证码
  };

  // 重新获取验证码
  const handleResendCode = (type: 'email' | 'phone') => {
    if (type === 'email') {
      if (!validateInput(email, 'email')) return;
      if (!emailCountdownState.isCounting) {
        sendVerificationCode('email');
        emailCountdownState.startCountdown();
      }
    } else {
      if (!validateInput(phone, 'phone')) return;
      if (!phoneCountdownState.isCounting) {
        sendVerificationCode('phone');
        phoneCountdownState.startCountdown();
      }
    }
  };

  const handleContinue = () => {
    // 在继续前验证输入
    if (!validateCurrentInput()) return;

    if (loginType === 'email') {
      if (showEmailVerificationCode) {
        // 如果已经显示验证码输入框，则执行登录
        setIsLoggingIn(true);
        if (email && emailVerificationCode) {
          signIn('email', { code: emailVerificationCode, email, redirectTo: callbackUrl });
        }
      } else {
        // 显示邮箱验证码输入框并发送验证码
        setShowEmailVerificationCode(true);
        emailCountdownState.startCountdown();
        sendVerificationCode('email');
      }
    } else {
      if (showPhoneVerificationCode) {
        // 如果已经显示验证码输入框，则执行登录
        setIsLoggingIn(true);
        if (phone && phoneVerificationCode) {
          signIn('credentials', { code: phoneVerificationCode, phone, redirectTo: callbackUrl });
        }
      } else {
        // 显示手机验证码输入框并发送验证码
        setShowPhoneVerificationCode(true);
        phoneCountdownState.startCountdown();
        sendVerificationCode('phone');
      }
    }
  };

  // 判断继续按钮是否可用
  const isContinueDisabled = Boolean(
    (loginType === 'email' &&
      (!email || emailError || (showEmailVerificationCode && !emailVerificationCode))) ||
      (loginType === 'phone' &&
        (!phone || phoneError || (showPhoneVerificationCode && !phoneVerificationCode))),
  );

  // 获取当前登录类型的验证码显示状态
  const showVerificationCode =
    loginType === 'email' ? showEmailVerificationCode : showPhoneVerificationCode;

  // 处理回车键事件
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isContinueDisabled) {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div>
      <div className={styles.loginTypeContainer}>
        <div
          className={`${styles.loginTypeOption} ${loginType === 'email' ? styles.loginTypeActive : ''}`}
          onClick={() => {
            setLoginType('email');
          }}
        >
          邮箱登录
        </div>
        <div
          className={`${styles.loginTypeOption} ${loginType === 'phone' ? styles.loginTypeActive : ''}`}
          onClick={() => {
            setLoginType('phone');
          }}
        >
          手机登录
        </div>
      </div>

      {loginType === 'email' ? (
        <>
          <Form.Item
            className={styles.formItem}
            help={emailError}
            validateStatus={emailError ? 'error' : ''}
          >
            <Input
              autoFocus
              disabled={emailCountdownState.isCounting}
              key={'email'}
              onChange={(e) => handleInputChange(e, 'email')}
              onKeyDown={handleKeyPress}
              placeholder="请输入邮箱地址"
              value={email}
            />
          </Form.Item>

          <VerificationCodeInput
            countdown={emailCountdownState.countdown}
            isCountingDown={emailCountdownState.isCounting}
            onKeyDown={handleKeyPress}
            onResend={() => handleResendCode('email')}
            setVerificationCode={setEmailVerificationCode}
            showVerificationCode={showEmailVerificationCode}
            styles={styles}
            verificationCode={emailVerificationCode}
          />
        </>
      ) : (
        <>
          <Form.Item
            className={styles.formItem}
            help={phoneError}
            validateStatus={phoneError ? 'error' : ''}
          >
            <Input
              autoFocus
              disabled={phoneCountdownState.isCounting}
              key={'phone'}
              onChange={(e) => handleInputChange(e, 'phone')}
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
            onResend={() => handleResendCode('phone')}
            setVerificationCode={setPhoneVerificationCode}
            showVerificationCode={showPhoneVerificationCode}
            styles={styles}
            verificationCode={phoneVerificationCode}
          />
        </>
      )}

      <div className={styles.buttonContainer}>
        <Button block disabled={isContinueDisabled} onClick={handleContinue} type={'primary'}>
          {showVerificationCode ? '登录' : '继续 ›'}
        </Button>
      </div>
    </div>
  );
}
