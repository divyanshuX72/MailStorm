/**
 * AES-256-GCM Encryption Service
 * Used to encrypt sensitive data like SMTP passwords
 * Never stores plain-text passwords
 */

import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'utf-8');

/**
 * Encrypt a plain text string using AES-256-GCM
 * Returns a combined string: iv:authTag:encrypted (all hex encoded)
 */
export function encrypt(plainText: string): string {
  // Generate a random IV for each encryption (more secure than fixed IV)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(plainText, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Combine IV, auth tag, and encrypted data
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * Expects format: iv:authTag:encrypted (all hex encoded)
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

/**
 * Test if encryption/decryption works correctly
 * Used for health checks
 */
export function testEncryption(): boolean {
  try {
    const testString = 'encryption-test-' + Date.now();
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    return decrypted === testString;
  } catch {
    return false;
  }
}
