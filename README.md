# asarmor
CLI tool and library that modifies your asar file to protect it from extraction (e.g by using `asar extract`).
This is not bulletproof, but can be useful as a first level of protection.

## installation
Install as local library: `$ npm install --save-dev asarmor`

Install as global CLI app: `$ npm install -g asarmor`

## usage

### CLI
```
$ asarmor --help

Usage: asarmor [options]

Options:
  -V, --version                  output the version number
  -a, --archive <archive>        input asar file (required)
  -o, --output <output>          output asar file (required)
  -b, --backup                   create backup
  -r, --restore                  restore backup
  -bl, --bloat [gigabytes]       add huge random files to disk on extraction attempt
  -t, --trashify [junkfiles...]  add fake files to the archive
  -h, --help                     display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --bloat 1000
  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts
  $ asarmor -a app.asar -o asarmor.asar --trashify --backup
  $ asarmor -a app.asar --restore
```

### library
```javascript
const asarmor = require('asarmor');

(async () => {
  // Read & parse the asar file.
  // This can take a while depending on the size of your file.
  const archive = await asarmor.open('app.asar');

  // Create a backup, which can be restored at any point in time through CLI or code.
  await archive.createBackup({backupPath: '~/Documents/backups/app.asar.backup'});

  // Apply customized trash patch.
  // The trash patch by itself will make sure `asar extract` fails.
  archive.patch(asarmor.createTrashPatch({
    filenames: ['foo', 'bar'],
    beforeWrite: (filename) => {
      const extensions = ['js', 'ts', 'tsx', 'txt'];
      const extension = extensions[Math.floor(Math.random() * extensions.length)];
      return filename + '.' + extension;
    }
  }));

  // Apply customized bloat patch.
  // The bloat patch by itself will write randomness to disk on extraction attempt.
  archive.patch(asarmor.createBloatPatch(50)); // adds 50 GB of bloat in total

  // Write changes back to disk.
  const outputPath = await archive.write('app.asar');
  console.log('successfully wrote changes to ' + outputPath);
})();
```

#### advanced
```javascript
const asarmor = require('asarmor');

(async () => {
  const archive = await asarmor.open('app.asar');

  // Apply a fully customized patch.
  // Play around with the different values to see what works best for you.
  archive.patch({
    header: {
      files: {
        'foo.js': {offset: 0, size: -999},
        'bar.js': {offset: -123, size: 1337},
      }
    },
  });

  // Write result back to file.
  await archive.write('protected.asar');
})();
```

### electron-builder
You can easily include asarmor in your packaging process using an [afterPack](https://www.electron.build/configuration/configuration.html#afterpack) hook:
```javascript
const asarmor = require('asarmor');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`applying asarmor patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

### examples
See [examples](example) for detailed code examples.

## FAQ
**Do protections affect my (electron) app performance?**

Nope. Electron can still read your asar file at the same speed as if nothing changed. 
The same should be true for other frameworks that utilise the asar format (unless the implementation differs drastically for some reason, which is out of my control).

## support
Found a bug or have a question? [Open an issue](https://github.com/sleeyax/asarmor/issues) if it doesn't exist yet. Pull Requests are welcome, but please open an issue first if you're adding major changes!

## related projects
Here are some other interesting projects (besides [asar](https://www.npmjs.com/package/asar) of course) I came across and/or might have taken inspiration from while researching the asar format:
* [asarbreak](https://www.npmjs.com/package/asarbreak)
* [patch-asar](https://www.npmjs.com/package/patch-asar)
