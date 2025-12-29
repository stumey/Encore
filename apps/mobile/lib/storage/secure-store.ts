import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'encore_auth_token';
const REFRESH_TOKEN_KEY = 'encore_refresh_token';
const USER_KEY = 'encore_user';

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
      this.removeUser(),
    ]);
  },
};
