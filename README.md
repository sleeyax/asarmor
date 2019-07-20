# asarmor
CLI tool and library that modifies your asar file to protect it from extraction (e.g by using `asar extract`).
This is absolutely not bulletproof, but can be usefull in some scenarios.

## installation
```$ npm i asarmor```

## usage
### CLI
```
$ asarmor --help

Usage: asarmor [options]

Options:
  -a, --archive <archive>  input asar file (required)
  -o, --output <output>    output asar file (required)
  --filecrash <filename>   stop extraction by corrupting specified file within the archive
  -h, --help               output usage information
```
### library
```
const {Asarmor, FileCrash} = require('asarmor');

const asarmor = new Asarmor('input.asar');
asarmor.applyProtection(new FileCrash('target.js'));
asarmor.write('output.asar');
```
