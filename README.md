# asarmor
Protects asar files from extraction (with `asar extract`).
The [strategies](#strategies) provided by asarmor are not bulletproof, but can be useful as a first level of protection.

## Sponsors

---

> Maintenance of this project is made possible by all the lovely contributors and sponsors.
If you'd like to sponsor this project and have your avatar or company logo appear in this section, click [here](https://github.com/sponsors/sleeyax). 💖

## Strategies

### Patches
Asarmor can apply patches to your asar file to make it challenging to extract. The patches are applied in a way that doesn't affect the functionality of your application. 

Unfortunately, at the time of writing, most of the 'old school' patches have been patched (pun not intended) by the `asar` project itself. For that reason I strongly recommend enabling [encryption](#encryption) as well.

### Encryption  
Asarmor can encrypt all JavaScript files in your asar archive. No Electron recompilation required! Huge thanks to [toyobayashi's](https://github.com/toyobayashi) wonderful [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo) for making this possible. If you're interested in the details I highly recommend you check out the [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo) repository. 

## Usage
You can use asarmor as a CLI tool or as a library in your project. The CLI tool is useful for quick and easy protection of your asar files or for trying out asarmor. The library is useful for more advanced use cases, such as integrating asarmor into your Electron project.

### CLI

Installation:

`npm install -g asarmor`

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
  -e, --encryption          encrypt the JavaScript files stored in the archive
  -h, --help                display help for command

Examples:
  $ asarmor -a app.asar -o asarmor.asar --backup --bloat 1000
  $ asarmor -a plaintext.asar -o encrypted.asar --encryption
```

### Library

Installation:

`npm install --save-dev asarmor`

Usage:

```javascript
const asarmor = require('asarmor');

(async () => {
  // Encrypt the JavaScript file contents stored within the asar file.
  await asarmor.encrypt({
    src: './app.asar', // target asar file to encrypt
    dst: './encrypted.asar', // output asar file
  });

  // Read & parse the (optionally encrypted) asar file.
  // This can take a while depending on the size of your file.
  const archive = await asarmor.open('encrypted.asar');

  // Create a backup, which can be restored at any point in time through CLI or code.
  await archive.createBackup({backupPath: '~/Documents/backups/encrypted.asar.backup'});

  // Apply customized bloat patch.
  // The bloat patch by itself will write randomness to disk on extraction attempt.
  archive.patch(asarmor.createBloatPatch(50)); // adds 50 GB of bloat in total

  // Write changes back to disk.
  const outputPath = await archive.write('app.asar');
  console.log('successfully wrote changes to ' + outputPath);
})();
```

### [electron-builder](https://www.electron.build/)
You can easily include asarmor in your packaging process using an [afterPack](https://www.electron.build/configuration/configuration.html#afterpack) hook:
```javascript
const asarmor = require('asarmor');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`asarmor is applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

There's a few more steps involved to get encryption working. See [example/electron](https://github.com/sleeyax/asarmor/tree/master/example/electron) if you'd like to skip ahead to the code.

Steps:

1. Update [afterPack.js](./example/electron/afterPack.js):
```js
exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');

    console.log(
      `  \x1B[34m•\x1B[0m asarmor encrypting contents of ${asarPath}`
    );
    await encrypt({
      src: asarPath,
      dst: asarPath,
    });

    // then patch the header
    console.log(`  \x1B[34m•\x1B[0m asarmor applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
```

2. Create [beforePack.js](./example/electron/beforePack.js):
```js
const { join } = require('path');
const { copyFile } = require('fs/promises');

exports.default = async (context) => {
  try {
    console.log('copying native dependencies');

    const release = join(__dirname, '..', 'node_modules', 'asarmor', 'build', 'Release');

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

3. Update your project's [package.json](./example/electron/package.json) entrypoint:
```diff
+ "main": "./dist/main/main.node",
- "main": "./dist/main/main.js",
```

4. **Optional**: load configuration hooks at the start of the [main process](./example/electron/src/main/main.ts) file:
```ts
// main.ts
import { allowUnencrypted } from 'asarmor';

allowUnencrypted(['node_modules']); // enables resolution of non-encrypted dependencies from `node_modules.asar`
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

7. Export a default function in the main process, accepting the decryption key as a parameter. 
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

### [electron-forge](https://www.electronforge.io/)
The instructions below assume you're using [Vite + TypeScript](https://www.electronforge.io/config/plugins/vite), so please adjust according to your project configuration.

You can easily include asarmor in your packaging process using a [postPackage](https://www.electronforge.io/config/hooks#postpackage) hook:

```ts
import * as asarmor from 'asarmor';

const config = {
  // ...
  hooks: {
    // ...
    postPackage: async (forgeConfig, buildPath) => {
      const asarPath = `${buildPath.outputPaths[0]}/resources/app.asar`;
      console.log(
        `asarmor is encrypting all JavaScript files stored in ${asarPath}`
      );
      await asarmor.encrypt({
        src: asarPath,
        dst: asarPath,
      });
      console.log(`asarmor is applying patches to ${asarPath}`);
      const archive = await asarmor.open(asarPath);
      archive.patch();
      await archive.write(asarPath);
    },
  },
};
```

There's a few more steps involved to get encryption working. See [example/electron-forge](./example/electron-forge) if you'd like to skip ahead to the code.

Steps:

1. Add the following hooks to your `forge.config.ts`:
```ts
import { join } from 'path';
import { copyFile } from "fs/promises";
import * as asarmor from "asarmor";

const config = {
  // ...
  hooks: {
    // ...
    packageAfterCopy: async (forgeConfig, buildPath) => {
      try {
        console.log('copying native asarmor dependencies');

        const release = join(__dirname, 'node_modules', 'asarmor', 'build', 'Release');
    
        // copy main.node from asarmor to our build folder; this will become the entrypoint later on.
        await copyFile(
          join(release, 'main.node'),
          join(
            buildPath,
            '.vite', // change this if you're not using Vite
            'build',
            'main.node'
            )
        );
    
        // copy renderer.node to our build folder; the render process will be bootstrapped from the main process later on.
        await copyFile(
          join(release, 'renderer.node'),
          join(
            buildPath,
            '.vite', // change this if you're not using Vite
            'renderer',
            'main_window',
            'renderer.node'
          )
        );

        // uncomment the line below to copy the final build directory for debugging purposes.
        // await cp(buildPath, './tmp', {recursive: true, force: true});
      } catch (err) {
        console.error(err);
      }
    },
    postPackage: async (forgeConfig, buildPath) => {
      const asarPath = `${buildPath.outputPaths[0]}/resources/app.asar`;
      console.log(
        `asarmor is encrypting all JavaScript files stored in ${asarPath}`
      );
      await asarmor.encrypt({
        src: asarPath,
        dst: asarPath,
      });
      console.log(`asarmor is applying patches to ${asarPath}`);
      const archive = await asarmor.open(asarPath);
      archive.patch();
      await archive.write(asarPath);
    },
  },
};
```

2. Update your project's [package.json](./example/electron-forge/package.json) entrypoint:
```diff
+ "main": ".vite/build/main.node",
- "main": ".vite/build/main.js",
```

3. **Optional**: disable chunk splitting of renderer assets. This is recommended to ensure the renderer assets can be bootstrapped correctly from the main process. 

You may choose to skip this step or handle it differently, but whatever you do, please make sure you know the file names so they can be dynamically required from the main process. See step `5` below for more information.

```ts
// vite.renderer.config.ts
return {
  // ...
  build: {
    // ...
    // Add the following rollup configuration:
    rollupOptions: {
      output: {
        // Disable chunk splitting.
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
};
```

4. Update your `BrowserWindow.webPreferences` configuration settings:
```ts
const mainWindow = new BrowserWindow({
    // ...
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'), // DISABLE THIS (preload scripts are not supported, see #40)
      nodeIntegration: true,   // MUST BE ENABLED
      contextIsolation: false, // MUST BE DISABLED
    },
  });
```

5. Bootstrap the render process:
```ts
await mainWindow.webContents.executeJavaScript(`!function () {
  require('./renderer.node');
  require('./assets/index.js');
}()`);
```

If you deviated from the default instructions in step `3`, replace `./assets/index.js` with the path to your renderer asset.

6. Export a default function in the main process, accepting the decryption key as a parameter.
```ts
export default function bootstrap(k: Uint8Array) {
  // sanity check
  if (!Array.isArray(k) || k.length === 0) {
    throw new Error('Failed to bootstrap application.');
  }

  // key should be valid at this point, but you can access it here to perform additional checks.
  console.log('decryption key: ' + k);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
```

## Support
Found a bug or have a question? [Open an issue](https://github.com/sleeyax/asarmor/issues) if it doesn't exist yet. Pull Requests are welcome, but please open an issue first if you're adding major changes!

## Credits
A special thanks to the following projects for making this project possible:
* [asar](https://github.com/electron/asar)
* [asarbreak](https://www.npmjs.com/package/asarbreak)
* [patch-asar](https://github.com/L1lith/patch-asar)
* [electron-asar-encrypt-demo](https://github.com/toyobayashi/electron-asar-encrypt-demo)
