/**
 * Generates a new random AES key to encrypt the asar archive files with if, it doesn't exist yet.
 */

const fs = require('fs');
const {join} = require('path');
const {spawn} = require('./spawn');

(async function () {
  if (!fs.existsSync(join(__dirname, '..', 'build'))) {
    // for local development
    await spawn('node', [
      join(require.resolve('typescript'), '..', '..', 'bin', 'tsc')
    ], { cwd: join(__dirname, '..') });
  }
  const {writeKeySync, generateRandomKey} = require('../build/src/encryption/helpers');
  const keyFileBuild = join(__dirname, '..', 'build', 'src', 'encryption', 'key.txt');
  const keyFileSrc = join(__dirname, '..', 'src', 'encryption', 'key.txt');
  
  if (!fs.existsSync(keyFileBuild) || !fs.existsSync(keyFileSrc)) {
    const key = generateRandomKey();
    // write the same copy to both src and build directories
    writeKeySync(key, keyFileBuild);
    writeKeySync(key, keyFileSrc);
  }
})();
