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

  /**
   *  File path to a hex-encoded encryption key or the encryption key in plaintext.
   */
  key?: string;
};

// TODO: encrypt files from existing asar archive.
// See: https://github.com/sleeyax/asarmor/issues/42

/**
 * Encrypts and packages all files into an asar archive.
 */
export async function encrypt({
  key: keyOrFile = join(__dirname, 'key.txt'),
  src,
  dst,
}: EncryptionOptions) {
  const key = (await pathExists(keyOrFile))
    ? Buffer.from(fromHex(await readFile(keyOrFile)))
    : Buffer.from(keyOrFile.includes(',') ? fromHex(keyOrFile) : keyOrFile);
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
