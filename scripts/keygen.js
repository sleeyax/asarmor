/**
 * Generates a new random AES key to encrypt the asar archive files with if, it doesn't exist yet.
 */

const fs = require('fs');
const {join} = require('path');
const {writeKeySync, generateRandomKey} = require('../build/src/encryption/helpers');

const keyFile = join(__dirname, '..', 'build', 'src', 'encryption', 'key.txt');

if (!fs.existsSync(keyFile)) {
  writeKeySync(generateRandomKey(), keyFile);
}
