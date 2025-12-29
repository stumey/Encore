import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import Config from '@/constants/Config';
import { secureStorage } from '../storage/secure-store';

const poolData = {
  UserPoolId: Config.COGNITO_USER_POOL_ID,
  ClientId: Config.COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

class CognitoAuthService {
  private currentUser: CognitoUser | null = null;

  async signUp({ email, password, name }: SignUpParams): Promise<CognitoUser> {
    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
      new CognitoUserAttribute({
        Name: 'name',
        Value: name,
      }),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error('No result from signup'));
          return;
        }
        resolve(result.user);
      });
    });
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async signIn({ email, password }: SignInParams): Promise<AuthUser> {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    this.currentUser = cognitoUser;

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (session: CognitoUserSession) => {
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          await secureStorage.setToken(idToken);
          await secureStorage.setRefreshToken(refreshToken);

          const user = await this.getCurrentUser();
          if (user) {
            await secureStorage.setUser(user);
            resolve(user);
          } else {
            reject(new Error('Failed to get user info'));
          }
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async signOut(): Promise<void> {
    if (this.currentUser) {
      this.currentUser.signOut();
    }
    await secureStorage.clearAll();
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      return null;
    }

    this.currentUser = cognitoUser;

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }

        cognitoUser.getUserAttributes((err, attributes) => {
          if (err || !attributes) {
            reject(err);
            return;
          }

          const email = attributes.find(attr => attr.Name === 'email')?.Value || '';
          const name = attributes.find(attr => attr.Name === 'name')?.Value || '';
          const emailVerified = attributes.find(attr => attr.Name === 'email_verified')?.Value === 'true';
          const sub = attributes.find(attr => attr.Name === 'sub')?.Value || '';

          resolve({
            id: sub,
            email,
            name,
            emailVerified,
          });
        });
      });
    });
  }

  async getSession(): Promise<CognitoUserSession | null> {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      return null;
    }

    return new Promise((resolve) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  }

  async getIdToken(): Promise<string | null> {
    const session = await this.getSession();
    return session ? session.getIdToken().getJwtToken() : null;
  }

  async forgotPassword(email: string): Promise<void> {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async refreshSession(): Promise<string | null> {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      return null;
    }

    return new Promise((resolve) => {
      cognitoUser.getSession(async (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }

        const refreshToken = session.getRefreshToken();

        cognitoUser.refreshSession(refreshToken, async (err, newSession) => {
          if (err || !newSession) {
            resolve(null);
            return;
          }

          const idToken = newSession.getIdToken().getJwtToken();
          await secureStorage.setToken(idToken);
          resolve(idToken);
        });
      });
    });
  }
}

export const cognitoAuth = new CognitoAuthService();
