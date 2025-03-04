'use client';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { AuthError } from 'next-auth';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, useState } from 'react';

import AuthIcons from '@/components/NextAuth/AuthIcons';
import { useUserStore } from '@/store/user';

import EmailSignIn from './EmailSignIn';
import PhoneSignIn from './PhoneSignIn';
import { useVerificationStyles } from './VerificationComponents';

const { Title, Paragraph } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-width: 360px;
    max-width: 400px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorBgContainer};
    box-shadow: 0 2px 10px rgba(0, 0, 0, 5%);
  `,
  contentCard: css`
    padding-block: 2rem;
    padding-inline: 2rem;
  `,
  description: css`
    margin: 0;
    margin-block-end: 24px;
    color: ${token.colorTextSecondary};
  `,
  footer: css`
    padding: 1rem;
    border-block-start: 1px solid ${token.colorBorderSecondary};
    border-radius: 0 0 8px 8px;

    color: ${token.colorTextDescription};
    text-align: center;

    background: ${token.colorBgElevated};
  `,
  iconButton: css`
    display: flex;
    align-items: center;
    justify-content: center;

    margin-block: 0;
    margin-inline: 8px;
    padding-block: 5px 0;
    padding-inline: 0;
    border-radius: 50%;
  `,
  iconContainer: css`
    display: flex;
    justify-content: center;
    margin-block: 16px 16px;
  `,
  logo: css`
    margin-block-end: 12px;
    border-radius: 50%;
  `,
  registerLink: css`
    margin-inline-start: 8px;
    color: ${token.colorPrimary};
  `,
  text: css`
    text-align: center;
  `,
  title: css`
    margin: 0;
    margin-block-end: 8px;

    font-size: 24px;
    font-weight: 600;
    color: ${token.colorTextHeading};
  `,
}));

export default memo(() => {
  const { styles } = useStyles();
  const verificationStyles = useVerificationStyles();
  const router = useRouter();
  const oAuthSSOProviders = useUserStore((s) => s.oAuthSSOProviders);
  const searchParams = useSearchParams();
  const [loginType, setLoginType] = useState('email'); // 'email' 或 'phone'

  // Redirect back to the page url
  const callbackUrl = searchParams.get('callbackUrl') ?? '';

  const handleSignIn = async (provider: string) => {
    try {
      await signIn(provider, { redirectTo: callbackUrl });
    } catch (error) {
      if (error instanceof AuthError) {
        return router.push(`/next-auth/?error=${error.type}`);
      }
      throw error;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentCard}>
        {/* Card Body */}
        <Flex gap="large" vertical>
          {/* Header */}
          <div className={styles.text}>
            <Image
              alt="logo"
              className={styles.logo}
              height={50}
              src="/icons/icon-512x512.maskable.png"
              width={50}
            />
            <Title className={styles.title} level={4}>
              登录到 nunuai
            </Title>
            <Paragraph className={styles.description}>欢迎回来！请登录以继续</Paragraph>
          </div>
          {/* Content */}
          <Flex gap="small" vertical>
            <div>
              <div className={verificationStyles.styles.loginTypeContainer}>
                <div
                  className={`${verificationStyles.styles.loginTypeOption} ${
                    loginType === 'email' ? verificationStyles.styles.loginTypeActive : ''
                  }`}
                  onClick={() => {
                    setLoginType('email');
                  }}
                >
                  邮箱登录
                </div>
                <div
                  className={`${verificationStyles.styles.loginTypeOption} ${
                    loginType === 'phone' ? verificationStyles.styles.loginTypeActive : ''
                  }`}
                  onClick={() => {
                    setLoginType('phone');
                  }}
                >
                  手机登录
                </div>
              </div>

              {loginType === 'email' ? (
                <EmailSignIn callbackUrl={callbackUrl} />
              ) : (
                <PhoneSignIn callbackUrl={callbackUrl} />
              )}
            </div>

            {oAuthSSOProviders ? (
              <div className={styles.iconContainer}>
                {oAuthSSOProviders.map((provider) => {
                  if (provider !== 'sms' && provider !== 'email') {
                    return (
                      <Button
                        className={styles.iconButton}
                        icon={AuthIcons(provider, 24)}
                        key={provider}
                        onClick={() => handleSignIn(provider)}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className={styles.iconContainer}>
                <Skeleton.Avatar active size={44} style={{ margin: '0 8px' }} />
                <Skeleton.Avatar active size={44} style={{ margin: '0 8px' }} />
              </div>
            )}
          </Flex>
        </Flex>
      </div>
      <div className={styles.footer}>
        登录即同意 nunuai
        <Link className={styles.registerLink} href="/register">
          《隐私政策》
        </Link>
      </div>
    </div>
  );
});
