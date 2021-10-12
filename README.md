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
  -V, --version                         output the version number
  -a, --archive <archive>               input asar file (required)
  -o, --output <output>                 output asar file (required)
  -v, --verbose                         enable verbose console output
  -b, --backup                          create backup
  -r, --restore                         restore backup (protections aren't applied)
  -f, --filetocrash <filename size...>  corrupt specified file within the archive
  -bl, --bloat [gigabytes]              add huge random files to disk on extraction attempt
  -t, --trashify [junkfiles...]         add fake files to the archive
  -h, --help                            display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js
  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js -999
  $ asarmor -a app.asar -o asarmor.asar --bloat 1000
  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts
  $ asarmor -a app.asar -o asarmor.asar --trashify --backup
  $ asarmor -a app.asar --restore
```
### library
```javascript
const {Asarmor, FileCrash, Trashify, Bloat} = require('asarmor');

const asarmor = new Asarmor('app.asar');
asarmor.createBackup('~/Documents/backups/app.asar.backup');
asarmor.applyProtection(new FileCrash('target.js', -999));
asarmor.applyProtection(new Trashify(['foo', 'bar'], Trashify.Randomizers.randomExtension(['js', 'ts', 'txt'])));
asarmor.applyProtection(new Trashify(['baz'], Trashify.Randomizers.junkExtension()));
asarmor.applyProtection(new Bloat(100)); // add 100 GB of bloat files to disk when someone tries to run 'asar extract'
asarmor.write('app.asar')
  .then(outputPath => console.log(`successfully wrote changes to ${outputPath}`))
  .catch(console.error);
```
### electron-builder
You can easily include asarmor in your packaging process using an [afterPack](https://www.electron.build/configuration/configuration.html#afterpack) hook:
```javascript
const { Asarmor, Trashify } = require('asarmor');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`applying asarmor protections to ${asarPath}`);
    const asarmor = new Asarmor(asarPath);
    asarmor.applyProtection(new Trashify(['.git', '.env']));
    await asarmor.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

## support
Found a bug or having a question? [Open an issue](https://github.com/sleeyax/asarmor/issues) if it doesn't exist yet. Pull Requests are welcome, but please open an issue first if you're adding major changes!
