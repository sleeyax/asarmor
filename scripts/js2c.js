/**
 * JavaScript to C/C++.
 * 
 * This script embeds the mangled and compressed source code of required core JavaScript functions into a static C++ header file `bootstrap.h`.
 */

// TODO: include all *.js files from bootstrap/*.js automatically?

const fs = require('fs/promises');
const { join } = require('path');
const terser = require('terser');

const targetDir = join(__dirname, '..', 'src', 'encryption');

const obfuscationOptions = {};

function wrap (code) {
  return `(${code});`
}

function str2buf (str) {
  const zero = Buffer.alloc(1);
  zero[0] = 0;
  return Buffer.concat([Buffer.from(str), zero]);
}

function buf2pchar(buf, varname) {
  return `const char ${varname}[]={${Array.prototype.join.call(buf, ',')}};`;
}

(async () => {
  const script1 = await terser.minify(await fs.readFile(join(targetDir, 'bootstrap', 'find-entrypoint.js'), 'utf8'), obfuscationOptions);
  const script2 = await terser.minify(await fs.readFile(join(targetDir, 'bootstrap', 'require.js'), 'utf8'), obfuscationOptions);

  const scriptFind = buf2pchar(str2buf(wrap(script1.code)), 'scriptFind');
  const scriptRequire = buf2pchar(str2buf(wrap(script2.code)), 'scriptRequire');
  
  await fs.writeFile(join(targetDir, 'bootstrap.h'), scriptFind + '\n' + scriptRequire + '\n', 'utf8');
})();
