/**
 * AWS Cognito Configuration
 *
 * This module exports the Cognito configuration object for AWS Amplify.
 * Configuration values are loaded from environment variables.
 */

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  domain?: string;
}

/**
 * Validates that all required Cognito environment variables are present
 * @throws Error if any required environment variable is missing
 */
function validateCognitoConfig(): void {
  const required = [
    'NEXT_PUBLIC_COGNITO_REGION',
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cognito environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Gets the Cognito configuration from environment variables
 * @returns CognitoConfig object
 */
export function getCognitoConfig(): CognitoConfig {
  validateCognitoConfig();

  return {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
  };
}

/**
 * AWS Amplify configuration object for Cognito authentication
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_COGNITO_REGION || '',
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      ...(process.env.NEXT_PUBLIC_COGNITO_DOMAIN && {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`],
          redirectSignOut: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin`],
          responseType: 'code' as const,
        },
      }),
    },
  },
};
