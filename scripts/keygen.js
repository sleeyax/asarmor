/**
 * Generates a new random AES key to encrypt the asar archive files with.
 */

const fs = require('fs')
const {join} = require('path');
const {writeKey, generateRandomKey} = require('../build/src/encryption/helpers');

const keyFile = join(__dirname, '..', 'src', 'encryption', 'key.txt');

if (!fs.existsSync(keyFile)) {
  writeKey(generateRandomKey(), keyFile);
}
