# asarmor
CLI tool and library that modifies your asar file to protect it from extraction (e.g by using `asar extract`).
This is absolutely not bulletproof, but can be usefull in some scenarios.

## installation
`$ npm i asarmor`

## usage
### CLI
```
$ asarmor --help

Usage: asarmor [options]

Options:
  -V, --version                  output the version number
  -a, --archive <archive>        input asar file (required)
  -o, --output <output>          output asar file (required)
  -v, --verbose                  enable verbose console output
  -f, --filetocrash <filename>   corrupt specified file within the archive 
  -t, --trashify [junkfiles...]  add non-existing junk files to the archive
  -h, --help                     display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js
  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts
```
### library
```javascript
const {Asarmor, FileCrash} = require('asarmor');

const asarmor = new Asarmor('input.asar');
asarmor.applyProtection(new FileCrash('target.js'));
asarmor.applyProtection(new Trashify(['foo', 'bar'], Randomizers.randomExtension));
asarmor.write('output.asar');
```
