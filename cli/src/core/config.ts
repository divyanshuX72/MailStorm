/**
 * CLI — Persistent Configuration Manager
 * Stores JWT tokens, user info, and settings in ~/.atreal-cso/config.json
 */

import Conf from 'conf';
import { CLIConfig } from './types';

const config = new Conf<CLIConfig>({
  projectName: 'atreal-cso',
  defaults: {
    apiUrl: 'http://localhost:5000',
    theme: 'dark',
  },
});

export const configManager = {
  /**
   * Get the full config
   */
  getAll(): CLIConfig {
    return {
      apiUrl: config.get('apiUrl'),
      accessToken: config.get('accessToken'),
      refreshToken: config.get('refreshToken'),
      user: config.get('user'),
      workspace: config.get('workspace'),
      theme: config.get('theme'),
      lastLogin: config.get('lastLogin'),
    };
  },

  /**
   * Get a specific config value
   */
  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return config.get(key);
  },

  /**
   * Set a config value
   */
  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    config.set(key, value);
  },

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return process.env.AGENT_API_URL || config.get('apiUrl') || 'http://localhost:5000';
  },

  /**
   * Store authentication data
   */
  setAuth(data: {
    accessToken: string;
    refreshToken: string;
    user: CLIConfig['user'];
  }): void {
    config.set('accessToken', data.accessToken);
    config.set('refreshToken', data.refreshToken);
    config.set('user', data.user);
    config.set('lastLogin', new Date().toISOString());
  },

  /**
   * Get access token
   */
  getAccessToken(): string | undefined {
    return config.get('accessToken');
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | undefined {
    return config.get('refreshToken');
  },

  /**
   * Get user info
   */
  getUser(): CLIConfig['user'] | undefined {
    return config.get('user');
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!config.get('accessToken');
  },

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    config.delete('accessToken' as any);
    config.delete('refreshToken' as any);
    config.delete('user' as any);
    config.delete('lastLogin' as any);
  },

  /**
   * Clear all config
   */
  clearAll(): void {
    config.clear();
  },

  /**
   * Get config file path (for display)
   */
  getPath(): string {
    return config.path;
  },
};
