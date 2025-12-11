/**
 * Authentication Module
 *
 * Central export point for all authentication-related functionality.
 * Provides AWS Cognito authentication via AWS Amplify v6.
 */

export { AuthProvider, useAuth } from './auth-provider';
export type { User } from './auth-provider';
export { getCognitoConfig, amplifyConfig } from './cognito-config';
export type { CognitoConfig } from './cognito-config';
export * from './utils';
