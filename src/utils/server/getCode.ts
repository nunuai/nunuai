import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
// import * as $tea from '@alicloud/tea-typescript';
import * as $Util from '@alicloud/tea-util';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Interface for Alibaba Cloud API error
 */
interface AlibabaSmsError extends Error {
  data?: {
    [key: string]: any;
    Recommend?: string;
  };
  message: string;
}

/**
 * Creates an Alibaba Cloud SMS client
 * @returns Dysmsapi20170525 client instance
 */
function createSmsClient(): Dysmsapi20170525 {
  // It's recommended to use STS for more secure authentication
  // See: https://help.aliyun.com/document_detail/378664.html
  const config = new $OpenApi.Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  });

  // Endpoint for the SMS service
  config.endpoint = 'dysmsapi.aliyuncs.com';

  return new Dysmsapi20170525(config);
}

/**
 * Interface for SMS verification code options
 */
interface SendVerificationCodeOptions {
  code?: string; // Optional: if not provided, a random code will be generated
  phoneNumber: string;
  signName: string;
  templateCode: string;
}

/**
 * Generates a random verification code
 * @param length Length of the verification code (default: 6)
 * @returns Random numeric verification code
 */
export function generateVerificationCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Sends a verification code via SMS using Alibaba Cloud SMS service
 * @param options Options for sending the verification code
 * @returns Object containing the result and the code that was sent
 */
export async function getVerificationCode(options: SendVerificationCodeOptions): Promise<{
  code: string;
  message?: string;
  requestId?: string;
  success: boolean;
}> {
  const { phoneNumber, signName, templateCode } = options;
  const code = options.code || generateVerificationCode();

  const client = createSmsClient();
  const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
    phoneNumbers: phoneNumber,
    signName: signName,
    templateCode: templateCode,
    templateParam: JSON.stringify({ code }),
  });

  const runtime = new $Util.RuntimeOptions({});

  try {
    // Send the SMS
    const response = await client.sendSmsWithOptions(sendSmsRequest, runtime);

    return {
      code,
      message: response.body?.message,
      requestId: response.body?.requestId,
      success: response.body?.code === 'OK',
    };
  } catch (error: unknown) {
    const smsError = error as AlibabaSmsError;
    console.error('Failed to send SMS:', smsError.message);
    if (smsError.data && smsError.data.Recommend) {
      console.error('Recommendation:', smsError.data.Recommend);
    }

    return {
      code,
      message: smsError.message,
      success: false,
    };
  }
}
