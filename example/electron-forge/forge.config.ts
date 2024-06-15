import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { join } from 'path';
import { copyFile, cp } from "fs/promises";
import * as asarmor from "asarmor";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
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

export default config;
