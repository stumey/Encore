import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_URL: 'http://localhost:3001/api',
    COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX',
    COGNITO_CLIENT_ID: 'your-client-id-here',
    COGNITO_REGION: 'us-east-1',
    S3_BUCKET: 'encore-media-dev',
    S3_REGION: 'us-east-1',
  },
  staging: {
    API_URL: 'https://api-staging.encore.app/api',
    COGNITO_USER_POOL_ID: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
    COGNITO_CLIENT_ID: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
    COGNITO_REGION: process.env.EXPO_PUBLIC_COGNITO_REGION || 'us-east-1',
    S3_BUCKET: process.env.EXPO_PUBLIC_S3_BUCKET || 'encore-media-staging',
    S3_REGION: process.env.EXPO_PUBLIC_S3_REGION || 'us-east-1',
  },
  prod: {
    API_URL: 'https://api.encore.app/api',
    COGNITO_USER_POOL_ID: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
    COGNITO_CLIENT_ID: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
    COGNITO_REGION: process.env.EXPO_PUBLIC_COGNITO_REGION || 'us-east-1',
    S3_BUCKET: process.env.EXPO_PUBLIC_S3_BUCKET || 'encore-media-prod',
    S3_REGION: process.env.EXPO_PUBLIC_S3_REGION || 'us-east-1',
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.releaseChannel;

  if (releaseChannel === 'prod') {
    return ENV.prod;
  } else if (releaseChannel === 'staging') {
    return ENV.staging;
  }

  return ENV.dev;
};

export default getEnvVars();
