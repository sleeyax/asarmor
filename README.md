# asarmor
CLI tool and library that modifies your asar file to protect it from extraction (e.g by using `asar extract`).
This is not bulletproof, but can be usefull as a first level of protection.

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
  $ asarmor -a app.asar --restore
```
### library
```javascript
const {Asarmor, FileCrash, Trashify} = require('asarmor');

const asarmor = new Asarmor('app.asar');
asarmor.createBackup('~/Documents/backups/app.asar.backup');
asarmor.applyProtection(new FileCrash('target.js'));
asarmor.applyProtection(new Trashify(['foo', 'bar'], Trashify.Randomizers.randomExtension(['js', 'ts', 'txt'])));
asarmor.applyProtection(new Trashify(['baz'], Trashify.Randomizers.junkExtension()));
asarmor.write('app.asar');
```
