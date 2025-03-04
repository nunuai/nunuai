'use client';

import { Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import { KeyboardEvent, useEffect, useState } from 'react';

// 样式定义
export const useVerificationStyles = createStyles(({ css, token }) => ({
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

// 验证码输入组件接口
export interface VerificationCodeInputProps {
  countdown: number;
  isCountingDown: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onResend: () => void;
  setVerificationCode: (code: string) => void;
  showVerificationCode: boolean;
  styles: ReturnType<typeof useVerificationStyles>['styles'];
  verificationCode: string;
}

// 验证码输入组件
export const VerificationCodeInput = ({
  showVerificationCode,
  verificationCode,
  setVerificationCode,
  isCountingDown,
  countdown,
  onResend,
  styles,
  onKeyDown,
}: VerificationCodeInputProps) => {
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

// 倒计时Hook
export const useCountdown = (initialValue = 0) => {
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