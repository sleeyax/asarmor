/**
 * JavaScript to C/C++.
 * 
 * This script embeds the mangled and compressed source code of required core JavaScript functions into a static C++ header file `bootstrap.h`.
 */

// TODO: include all *.js files from bootstrap/*.js automatically?

const fs = require('fs');
const { join } = require('path');
const terser = require('terser');

const targetDir = join(__dirname, '..', 'src', 'encryption');

var obfuscationOptions = {};

var script1 = terser.minify(fs.readFileSync(join(targetDir, 'bootstrap', 'find-entrypoint.js'), 'utf8'), obfuscationOptions);
var script2 = terser.minify(fs.readFileSync(join(targetDir, 'bootstrap', 'require.js'), 'utf8'), obfuscationOptions);

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

const scriptFind = buf2pchar(str2buf(wrap(script1.code)), 'scriptFind');
const scriptRequire = buf2pchar(str2buf(wrap(script2.code)), 'scriptRequire');

fs.writeFileSync(join(targetDir, 'bootstrap.h'), scriptFind + '\n' + scriptRequire + '\n', 'utf8');
