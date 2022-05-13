/**
 * Generates a new random AES key to encrypt the asar archive files with if, it doesn't exist yet.
 */

const fs = require('fs');
const {join} = require('path');
const {writeKeySync, generateRandomKey} = require('../build/src/encryption/helpers');

const keyFileBuild = join(__dirname, '..', 'build', 'src', 'encryption', 'key.txt');
const keyFileSrc = join(__dirname, '..', 'src', 'encryption', 'key.txt');

if (!fs.existsSync(keyFileBuild) || !fs.existsSync(keyFileSrc)) {
  const key = generateRandomKey();
  // write the same copy to both src and build directories
  writeKeySync(key, keyFileBuild);
  writeKeySync(key, keyFileSrc);
}
