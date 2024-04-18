# asarmor
Protects asar files from extraction (with `asar extract`).
The methods provided by asarmor are not bulletproof, but can be useful as a first level of protection.

## Usage
You can use asarmor as a CLI tool or as a library in your project. The CLI tool is useful for quick and easy protection of your asar files or for trying out asarmor. The library is useful for more advanced use cases, such as integrating asarmor into your Electron project.

### CLI

Installation:

`npm install --save-dev asarmor`

Usage:

```
Usage: asarmor [options]

Options:
  -V, --version             output the version number
  -a, --archive <archive>   input asar file (required)
  -o, --output <output>     output asar file (required)
  -b, --backup              create backup
  -r, --restore             restore backup
  -bl, --bloat [gigabytes]  fill the drive with useless data on extraction attempt
  -e, --encrypt <src>       encrypt file contents
  -k, --key <file path>     key file to use for encryption
  -h, --help                display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --bloat 1000
  $ asarmor -a app.asar -o asarmor.asar --backup
  $ asarmor -a app.asar --restore
```

### Library

Installation:

`npm install -g asarmor`

Usage:

```javascript
const asarmor = require('asarmor');
const { encrypt } = require('asarmor/encryption');

(async () => {
  // Encrypt the contents of the asar archive.
  await encrypt({
    src: './dist',     // source or transpiled code to encrypt
    dst: './app.asar', // target asar file
  });

  // Read & parse the (optionally encrypted) asar file.
  // This can take a while depending on the size of your file.
  const archive = await asarmor.open('app.asar');

  // Create a backup, which can be restored at any point in time through CLI or code.
  await archive.createBackup({backupPath: '~/Documents/backups/app.asar.backup'});

  // Apply customized bloat patch.
  // The bloat patch by itself will write randomness to disk on extraction attempt.
  archive.patch(asarmor.createBloatPatch(50)); // adds 50 GB of bloat in total

  // Write changes back to disk.
  const outputPath = await archive.write('app.asar');
  console.log('successfully wrote changes to ' + outputPath);
})();
```

## `electron-builder`
You can easily include asarmor in your packaging process using an [afterPack](https://www.electron.build/configuration/configuration.html#afterpack) hook:
```javascript
const asarmor = require('asarmor');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`asarmor applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

### Encryption  
Asarmor can encrypt the contents of your asar file. No Electron recompilation required! Huge thanks to [toyobayashi's](https://github.com/toyobayashi) wonderful [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo) for making this possible. I won't be going into too many details on how this works exactly. If you're interested in the details I highly recommend you check out the [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo) repository. 

There's a few more steps involved to make this work. See [example/electron](https://github.com/sleeyax/asarmor/tree/master/example/electron) if you'd like to skip ahead to the code.

Steps:

1. Update [afterPack.js](https://github.com/sleeyax/asarmor/blob/master/example/electron/afterPack.js):
```diff
exports.default = async ({ appOutDir, packager }) => {
  try {
+   const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
+   
+   // encrypt file contents first
+   const src = join(packager.info.projectDir, 'release', 'app');
+   const dst = asarPath;
+   console.log(`asarmor encrypting contents of ${src} to ${dst}`);
+   await encrypt({
+     // path to your source code (e.g. src, build or dist)
+     src,
+     // destination asar file to write to
+     dst,
+     // path to the encryption key file; asarmor should generate a new one every time it's installed as a dev-dependency.
+     keyFilePath: join(__dirname, '..', 'node_modules', 'asarmor', 'src', 'encryption', 'key.txt'),
+   });
+
+   // then patch the header
-   const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`asarmor applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

2. Create [beforePack.js](https://github.com/sleeyax/asarmor/blob/master/example/electron/beforePack.js):
```js
const { join } = require('path');
const { copyFile } = require('fs/promises');

exports.default = async (context) => {
  try {
    console.log('copying native dependencies');

    const release = join(__dirname, '..', 'node_modules', 'asarmor', 'Release');

    // copy main.node from asarmor to our dist/build/release folder; this will become the entrypoint later on.
    await copyFile(
      join(release, 'main.node'),
      join(
        context.packager.info.projectDir,
        'release',
        'app',
        'dist',
        'main',
        'main.node'
      )
    );

    // copy renderer.node to our dist/build/release folder; the render process will be bootstrapped from the main process later on.
    await copyFile(
      join(release, 'renderer.node'),
      join(
        context.packager.info.projectDir,
        'release',
        'app',
        'dist',
        'renderer',
        'renderer.node'
      )
    );
  } catch (err) {
    console.error(err);
  }
};
```

Don't forget to update `package.json` as well:
```diff
"afterPack": "./afterPack.js",
+ "beforePack": "./beforePack.js",
```

3. Update your project's [package.json](https://github.com/sleeyax/asarmor/blob/master/example/electron/package.json) entrypoint:
```diff
+ "main": "./dist/main/main.node",
- "main": "./dist/main/main.js",
```

4. Load any hooks at the start of the [main process](https://github.com/sleeyax/asarmor/blob/master/example/electron/src/main/main.ts) file (optional):
```ts
// main.ts
import { hookNodeModulesAsar } from 'asarmor/src/encryption/hooks';

// load hooks at the start of the file
hookNodeModulesAsar(); // enables resolution of non-encrypted dependencies from node_modules.asar
```

5. Update your `BrowserWindow.webPreferences` configuration settings:
```ts
const mainWindow = new BrowserWindow({
    // ...
    webPreferences: {
      nodeIntegration: true,   // MUST BE ENABLED
      contextIsolation: false, // MUST BE DISABLED
    },
  });
```

6. Bootstrap the render process:
```ts
await mainWindow.webContents.executeJavaScript(`!function () {
  require('../renderer/renderer.node');
  require('../renderer/renderer.js');
}()`);
```

7. Export a default function in the main process, accepting the decryption key as a paramater. 
```ts
module.exports = function bootstrap(k: Uint8Array) {
  // sanity check
  if (!Array.isArray(k) || k.length === 0) {
    throw new Error('Failed to bootstrap application.');
  }

  // key should be valid at this point, but you can access it here to perform additional checks.
  console.log('decryption key: ' + k);

  // start the app
  if (!process.env.ELECTRON_RUN_AS_NODE) {
    app
      .whenReady()
      .then(() => {
        createWindow();
        app.on('activate', () => {
          if (mainWindow === null) createWindow();
        });
      })
      .catch(console.log);
  } else {
    console.error('failed to bootstrap main process');
  }
};
```

## Examples
See [examples](example) for detailed code examples.

## FAQ
**Do protections affect my (electron) app performance?**

It depends. If you have a huge archive and applied encryption, then yes. Otherwise, electron should still be able read your asar file at the same speed as if nothing changed. 
The same should be true for other frameworks that utilize the asar format (unless the implementation differs drastically for some reason, which is out of my control).

## Sponsors

---

> Maintenance of this project is made possible by all the lovely contributors and sponsors.
If you'd like to sponsor this project and have your avatar or company logo appear in this section, click [here](https://github.com/sponsors/sleeyax). 💖

## Support
Found a bug or have a question? [Open an issue](https://github.com/sleeyax/asarmor/issues) if it doesn't exist yet. Pull Requests are welcome, but please open an issue first if you're adding major changes!

## Credits
A special thanks to the following projects for making this project possible:
* [asar](https://github.com/electron/asar)
* [asarbreak](https://www.npmjs.com/package/asarbreak)
* [patch-asar](https://github.com/L1lith/patch-asar)
* [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo)
