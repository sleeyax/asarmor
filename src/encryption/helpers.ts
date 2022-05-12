import fs from 'fs/promises';
import fsSync from 'fs';
import crypto from 'crypto';

/**
 * Convert an encryption key to a comma separeted hex string.
 * @param key encryption key in plaintext
 */
 export function toHex(key: string | Buffer) {
  const hex = Array.prototype.map.call(Buffer.from(key), (v => ('0x' + ('0' + v.toString(16)).slice(-2)))).toString();
  return Buffer.from(hex);
}

/**
 * Convert a comma separated hex string to a plaintext encryption key.
 * @param key comma separated hex string
 */
export function fromHex(key: string | Buffer) {
  return Buffer.from(key.toString().trim().split(',').map(v => Number(v.trim())));
}

export function generateRandomKey() {
  return crypto.randomBytes(32);
}

export async function writeKey(key: string | Buffer, filePath: string) {
  await fs.writeFile(filePath, toHex(key));
  return Buffer.from(key);
}

export function writeKeySync(key: string | Buffer, filePath: string) {
  fsSync.writeFileSync(filePath, toHex(key));
  return Buffer.from(key);
}
