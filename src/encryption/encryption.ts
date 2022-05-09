import crypto from 'crypto'
import { join, extname } from 'path';
import { createPackageWithOptions } from 'asar';
import { fromHex } from './helpers';
import { readFile } from 'fs/promises';

export type EncryptionOptions = {
	/**
	 * Source code to package into an asar archive.
	 * 
	 * E.g `src`
	 */
	src: string;

	/**
	 * Destination file asar file path.
	 * 
	 * E.g `app.asar`
	 */
	dst: string;

	/**
	 * File path to a hex-encoded encryption key.
	 */
	keyFilePath?: string;

  /**
   * Encryption key in plaintext.
   */
  key?: string;
}

/**
 * Encrypts and packages all files into an asar archive.
 */
 export async function encrypt({keyFilePath = join(__dirname, 'src/key.txt'), key: keyPlaintext, src, dst }: EncryptionOptions) {
   const key = keyPlaintext ? Buffer.from(keyPlaintext) : Buffer.from(fromHex(await readFile(keyFilePath)));

  return createPackageWithOptions(
    src,
    dst,
    {
      unpack: '*.node', // C++ modules should not be packed
      transform (filename) {
        if (extname(filename) == '.js') {
          // generate random 16-byte initialization vector (IV) 
          const iv = crypto.randomBytes(16);

          // whether we have already prefixed the first chunk of content with the IV
          let hasPrefix = false;

          const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            key,
            iv
          );
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
          }

          return cipher;
        }
      },
    }
  )
}
