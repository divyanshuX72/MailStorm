/**
 * CLI — Authentication Module
 * Handles login, token storage, refresh, and logout
 */

import inquirer from 'inquirer';
import { api } from './api-client';
import { configManager } from './config';
import { renderer } from './renderer';

export const auth = {
  /**
   * Interactive login prompt
   */
  async login(): Promise<boolean> {
    renderer.info('Please sign in to continue.\n');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input: string) => {
          if (!input || !input.includes('@')) return 'Please enter a valid email address';
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '●',
        validate: (input: string) => {
          if (!input || input.length < 1) return 'Password is required';
          return true;
        },
      },
    ]);

    const spinner = renderer.spinner('Authenticating...');

    try {
      const response = await api.post('/auth/login', {
        email: answers.email,
        password: answers.password,
      });

      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;

        configManager.setAuth({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });

        spinner.succeed(`Logged in as ${user.name} (${user.email})`);
        return true;
      } else {
        spinner.fail(response.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      spinner.fail(error.message || 'Authentication failed');
      return false;
    }
  },

  /**
   * Check if current session is valid
   */
  async verifySession(): Promise<boolean> {
    if (!configManager.isLoggedIn()) return false;

    try {
      const response = await api.get('/auth/profile');
      if (response.success && response.data) {
        // Update stored user info
        configManager.set('user', {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Logout — clear stored credentials
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore API errors during logout
    }
    configManager.clearAuth();
    renderer.success('Logged out successfully');
  },

  /**
   * Ensure user is authenticated (login if needed)
   */
  async ensureAuthenticated(): Promise<boolean> {
    // Check stored credentials
    if (configManager.isLoggedIn()) {
      const valid = await auth.verifySession();
      if (valid) return true;

      renderer.warning('Session expired. Please login again.');
      configManager.clearAuth();
    }

    // Prompt login
    return await auth.login();
  },
};
