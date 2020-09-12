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
  -b, --backup                   create backup
  -r, --restore                  restore backup (protections won't be applied)
  -f, --filetocrash <filename>   corrupt specified file within the archive    
  -t, --trashify [junkfiles...]  add non-existing junk files to the archive   
  -h, --help                     display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js
  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts
  $ asarmor -a app.asar -o asarmor.asar --trashify --backup
  $ asarmor -a app.asar -o asarmor.asar --trashify --restore
```
### library
```javascript
const {Asarmor, FileCrash, Trashify, Randomizers} = require('asarmor');

const asarmor = new Asarmor('app.asar');
asarmor.createBackup('~/Documents/backups/app.asar.backup');
asarmor.applyProtection(new FileCrash('target.js'));
asarmor.applyProtection(new Trashify(['foo', 'bar'], Randomizers.randomExtension));
asarmor.write('app.asar');
```
