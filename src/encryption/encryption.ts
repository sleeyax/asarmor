import crypto from 'crypto';
import { join, extname } from 'path';
import { createPackageWithOptions, extractAll } from '@electron/asar';
import { fromHex } from './helpers';
import { readFile } from 'fs/promises';
import { pathExists, remove } from 'fs-extra';

export type EncryptionOptions = {
  /**
   * File path to an input asar.
   *
   * @example `app.asar`.
   */
  src: string;

  /**
   * File path to the output asar.
   *
   * @example `encrypted.asar`.
   */
  dst: string;
};

/**
 * Encrypts and packages all files into an asar archive.
 */
export async function encrypt({ src, dst }: EncryptionOptions) {
  const keyFile = join(__dirname, 'key.txt');
  if (!pathExists(keyFile)) {
    throw new Error(`Key file '${keyFile}' not found.`);
  }

  const key = Buffer.from(fromHex(await readFile(keyFile)));
  const extractedPath = `${src}.extracted`;

  extractAll(src, extractedPath);

  await createPackageWithOptions(extractedPath, dst, {
    unpack: '*.node', // C++ modules should not be packed
    transform(filename) {
      if (extname(filename) == '.js') {
        // generate random 16-byte initialization vector (IV)
        const iv = crypto.randomBytes(16);

        // whether we have already prefixed the first chunk of content with the IV
        let hasPrefix = false;

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        cipher.setAutoPadding(true);
        cipher.setEncoding('base64');

        // monkey patch push method to put the IV in front of the encrypted data
        const _p = cipher.push;
        cipher.push = function (chunk, enc) {
          if (!hasPrefix && chunk != null) {
            hasPrefix = true;
            return _p.call(this, Buffer.concat([iv, chunk]), enc);
          } else {
            return _p.call(this, chunk, enc);
          }
        };

        return cipher;
      }
    },
  });

  await remove(extractedPath);
}
